import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthThrottleService } from './auth-throttle.service';

@Injectable()
export class AuthThrottleGuard implements CanActivate {
  constructor(private readonly throttle: AuthThrottleService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { body?: { email?: string } }>();
    this.throttle.assertAllowed(request.ip ?? request.socket.remoteAddress ?? 'unknown', request.body?.email);
    return true;
  }
}
