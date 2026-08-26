import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Response } from 'express';
import { RequestWithContext } from '../middleware/request-context.middleware';
import { writeStructuredLog } from '../logging/structured-logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(request, response, Date.now() - startedAt),
        error: () => this.log(request, response, Date.now() - startedAt),
      }),
    );
  }

  private log(
    request: RequestWithContext,
    response: Response,
    durationMs: number,
  ): void {
    const statusCode = response.statusCode;
    writeStructuredLog(
      statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info',
      'HTTP request completed',
      {
        type: 'http_request',
        requestId: request.requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode,
        durationMs,
      },
    );
  }
}
