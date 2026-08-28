import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService, type HouseholdRole } from './household-access.service';
import { HOUSEHOLDS_REPOSITORY, type HouseholdMemberRecord, type HouseholdsRepositoryPort } from './households.repository';

@Injectable()
export class HouseholdsService {
  constructor(
    @Inject(HOUSEHOLDS_REPOSITORY) private readonly repository: HouseholdsRepositoryPort,
    private readonly access: HouseholdAccessService,
  ) {}

  findMember(userId: number, householdId: number): Promise<HouseholdMemberRecord | null> {
    return this.repository.findMember(userId, householdId);
  }

  requireRole(userId: number, householdId: number, allowed: readonly HouseholdRole[]): Promise<void> {
    return this.access.requireRole(userId, householdId, allowed);
  }
}

export type HouseholdsServicePort = Pick<HouseholdsService, 'findMember' | 'requireRole'>;
