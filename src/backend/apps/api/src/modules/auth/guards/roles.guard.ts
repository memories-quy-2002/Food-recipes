import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../users/users.service';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import type { AuthUser } from '../types/auth-user.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Array<'user' | 'admin'>>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!request.user) throw new ForbiddenException({ code: 'ROLE_REQUIRED', message: 'A role is required' });
    const user = await this.usersService.findById(request.user.id);
    const role = user.role ?? 'user';
    if (!required.includes(role)) throw new ForbiddenException({ code: 'ROLE_REQUIRED', message: 'You do not have the required role' });
    request.user.role = role;
    return true;
  }
}
