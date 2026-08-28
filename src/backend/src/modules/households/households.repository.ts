import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { HouseholdRole } from './household-access.service';

export type HouseholdMemberRecord = {
  member_id: number;
  household_id: number;
  user_id: number;
  role: HouseholdRole;
};

export interface HouseholdsRepositoryPort {
  findMember(userId: number, householdId: number): Promise<HouseholdMemberRecord | null>;
}

export const HOUSEHOLDS_REPOSITORY = Symbol('HOUSEHOLDS_REPOSITORY');

@Injectable()
export class HouseholdsRepository implements HouseholdsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findMember(userId: number, householdId: number): Promise<HouseholdMemberRecord | null> {
    const rows = await this.prisma.$queryRaw<HouseholdMemberRecord[]>(Prisma.sql`
      SELECT member_id, household_id, user_id, role
      FROM household_members
      WHERE user_id = ${userId} AND household_id = ${householdId}
      LIMIT 1
    `);
    return rows[0] ?? null;
  }
}
