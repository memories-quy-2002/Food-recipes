import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { RequestWithContext } from '../middleware/request-context.middleware';
import { captureSentryException } from '../../bootstrap/instrument';

type ErrorBody = {
  statusCode?: number;
  code?: string;
  message?: string | string[];
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithContext>();
    const response = http.getResponse<Response>();
    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException ? exception.getResponse() : null;
    const body: ErrorBody =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? exceptionResponse
        : {};
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : body.message ??
        (isHttpException && typeof exceptionResponse === 'string'
          ? exceptionResponse
          : 'Internal server error');

    if (statusCode >= 500) {
      captureSentryException(exception, {
        requestId: request.requestId ?? request.header('X-Request-ID'),
        method: request.method,
        path: request.originalUrl,
        statusCode,
      });
    }

    response.status(statusCode).json({
      statusCode,
      code: body.code ?? this.defaultCode(statusCode),
      message,
      requestId: request.requestId ?? request.header('X-Request-ID') ?? null,
    });
  }

  private defaultCode(statusCode: number): string {
    return (
      {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        503: 'SERVICE_UNAVAILABLE',
      }[statusCode] ?? 'INTERNAL_SERVER_ERROR'
    );
  }
}
