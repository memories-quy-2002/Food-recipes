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
  shortages?: unknown;
  ingredient_names?: string[];
};

type UnknownHttpError = {
  status?: unknown;
  statusCode?: unknown;
  type?: unknown;
};

const isPayloadTooLargeError = (exception: unknown): exception is UnknownHttpError => {
  if (typeof exception !== 'object' || exception === null) return false;
  const candidate = exception as UnknownHttpError;
  return candidate.type === 'entity.too.large' || candidate.status === 413 || candidate.statusCode === 413;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithContext>();
    const response = http.getResponse<Response>();
    const isHttpException = exception instanceof HttpException;
    const isPayloadTooLarge = isPayloadTooLargeError(exception);
    const statusCode = isHttpException
      ? exception.getStatus()
      : isPayloadTooLarge
        ? HttpStatus.PAYLOAD_TOO_LARGE
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException ? exception.getResponse() : null;
    const body: ErrorBody =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? exceptionResponse
        : {};
    const message = isPayloadTooLarge
      ? 'Request payload is too large'
      : Array.isArray(body.message)
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
      ...(body.shortages === undefined ? {} : { shortages: body.shortages }),
      ...(body.ingredient_names === undefined ? {} : { ingredient_names: body.ingredient_names }),
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
        413: 'PAYLOAD_TOO_LARGE',
        503: 'SERVICE_UNAVAILABLE',
      }[statusCode] ?? 'INTERNAL_SERVER_ERROR'
    );
  }
}
