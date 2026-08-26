import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import type { RequestWithContext } from '../middleware/request-context.middleware';
import { captureSentryException } from '../../bootstrap/instrument';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithContext & Request>();
    const response = http.getResponse<Response>();
    const statusCode = exception.code === 'P2002'
      ? HttpStatus.CONFLICT
      : exception.code === 'P2025'
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const code = exception.code === 'P2002'
      ? 'RESOURCE_ALREADY_EXISTS'
      : exception.code === 'P2025'
        ? 'RESOURCE_NOT_FOUND'
        : 'DATABASE_ERROR';
    const message = exception.code === 'P2002'
      ? 'A resource with the same unique value already exists'
      : exception.code === 'P2025'
        ? 'The requested resource was not found'
        : 'Database operation failed';

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
      code,
      message,
      requestId: request.requestId ?? request.header('X-Request-ID') ?? null,
    });
  }
}
