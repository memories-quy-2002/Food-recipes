import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HouseholdAccessService, type HouseholdRole } from './household-access.service';

export const HOUSEHOLD_ROLES_KEY = 'household_roles';
export const HouseholdRoles = (...roles: HouseholdRole[]) => SetMetadata(HOUSEHOLD_ROLES_KEY, roles);

type HouseholdRequest = {
  user?: { id?: unknown };
  params?: { householdId?: unknown };
};

@Injectable()
export class HouseholdRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly access: HouseholdAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<readonly HouseholdRole[]>(HOUSEHOLD_ROLES_KEY, [context.getHandler(), context.getClass()]) ?? [];
    if (!roles.length) return true;
    const request = context.switchToHttp().getRequest<HouseholdRequest>();
    const userId = Number(request.user?.id);
    const householdId = Number(request.params?.householdId);
    if (!Number.isInteger(userId) || !Number.isInteger(householdId) || householdId < 1) {
      throw new ForbiddenException({ code: 'HOUSEHOLD_ACCESS_DENIED', message: 'A valid household is required' });
    }
    await this.access.requireRole(userId, householdId, roles);
    return true;
  }
}
