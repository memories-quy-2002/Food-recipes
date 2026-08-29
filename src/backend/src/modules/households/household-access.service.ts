import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { HOUSEHOLDS_REPOSITORY, type HouseholdsRepositoryPort } from './households.repository';

export type HouseholdRole = 'OWNER' | 'MEMBER' | 'VIEWER';

export interface HouseholdAccessServicePort {
  requireRole(userId: number, householdId: number, allowed: readonly HouseholdRole[]): Promise<void>;
}

@Injectable()
export class HouseholdAccessService implements HouseholdAccessServicePort {
  constructor(@Inject(HOUSEHOLDS_REPOSITORY) private readonly repository: HouseholdsRepositoryPort) {}

  async requireRole(userId: number, householdId: number, allowed: readonly HouseholdRole[]): Promise<void> {
    const member = await this.repository.findMember(userId, householdId);
    if (!member || !allowed.includes(member.role)) {
      throw new ForbiddenException({ code: 'HOUSEHOLD_ACCESS_DENIED', message: 'You do not have access to this household action' });
    }
  }
}
