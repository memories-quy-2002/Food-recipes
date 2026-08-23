import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export type RequestWithContext = Request & { requestId?: string };

export function requestContextMiddleware(
  request: RequestWithContext,
  response: Response,
  next: NextFunction,
): void {
  const requestId = request.header('X-Request-ID') ?? randomUUID();
  request.requestId = requestId;
  response.setHeader('X-Request-ID', requestId);
  next();
}
