import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { HouseholdRole } from './household-access.service';

export type HouseholdMemberRecord = {
  member_id: number;
  household_id: number;
  user_id: number;
  role: HouseholdRole;
  full_name?: string;
  email?: string;
};

export type HouseholdRecord = {
  household_id: number;
  name: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  role?: HouseholdRole;
};

export type HouseholdInviteRecord = {
  invite_id: number;
  household_id: number;
  invited_by: number;
  email: string;
  token_hash: string;
  expires_at: Date;
  accepted_at: Date | null;
  created_at: Date;
};

export interface HouseholdsRepositoryPort {
  findMember(userId: number, householdId: number): Promise<HouseholdMemberRecord | null>;
  createHousehold(userId: number, name: string): Promise<HouseholdRecord>;
  listForUser(userId: number): Promise<HouseholdRecord[]>;
  findForUser(userId: number, householdId: number): Promise<HouseholdRecord | null>;
  listMembers(householdId: number): Promise<HouseholdMemberRecord[]>;
  createInvite(householdId: number, invitedBy: number, email: string, tokenHash: string, expiresAt: Date): Promise<HouseholdInviteRecord>;
  findInviteByHash(tokenHash: string): Promise<HouseholdInviteRecord | null>;
  acceptInvite(inviteId: number, householdId: number, userId: number): Promise<HouseholdMemberRecord | null>;
  findMemberById(householdId: number, memberId: number): Promise<HouseholdMemberRecord | null>;
  countOwners(householdId: number): Promise<number>;
  updateMemberRole(householdId: number, memberId: number, role: HouseholdRole): Promise<HouseholdMemberRecord | null>;
  transferOwnership(householdId: number, currentOwnerUserId: number, memberId: number): Promise<HouseholdMemberRecord | null>;
  deleteMember(householdId: number, memberId: number): Promise<boolean>;
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

  async createHousehold(userId: number, name: string): Promise<HouseholdRecord> {
    const rows = await this.prisma.$queryRaw<HouseholdRecord[]>(Prisma.sql`
      INSERT INTO households (name, created_by)
      VALUES (${name}, ${userId})
      RETURNING household_id, name, created_by, created_at, updated_at
    `);
    const household = rows[0];
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO household_members (household_id, user_id, role)
      VALUES (${household.household_id}, ${userId}, 'OWNER')
    `);
    return household;
  }

  listForUser(userId: number): Promise<HouseholdRecord[]> {
    return this.prisma.$queryRaw<HouseholdRecord[]>(Prisma.sql`
      SELECT h.household_id, h.name, h.created_by, h.created_at, h.updated_at, hm.role
      FROM households h
      JOIN household_members hm ON hm.household_id = h.household_id
      WHERE hm.user_id = ${userId}
      ORDER BY h.updated_at DESC, h.household_id ASC
    `);
  }

  async findForUser(userId: number, householdId: number): Promise<HouseholdRecord | null> {
    const rows = await this.prisma.$queryRaw<HouseholdRecord[]>(Prisma.sql`
      SELECT h.household_id, h.name, h.created_by, h.created_at, h.updated_at
      FROM households h
      JOIN household_members hm ON hm.household_id = h.household_id
      WHERE hm.user_id = ${userId} AND h.household_id = ${householdId}
    `);
    return rows[0] ?? null;
  }

  listMembers(householdId: number): Promise<HouseholdMemberRecord[]> {
    return this.prisma.$queryRaw<HouseholdMemberRecord[]>(Prisma.sql`
      SELECT hm.member_id, hm.household_id, hm.user_id, hm.role, a.full_name, a.email
      FROM household_members hm
      JOIN accounts a ON a.user_id = hm.user_id
      WHERE hm.household_id = ${householdId}
      ORDER BY CASE hm.role WHEN 'OWNER' THEN 1 WHEN 'MEMBER' THEN 2 ELSE 3 END, hm.member_id ASC
    `);
  }

  async createInvite(householdId: number, invitedBy: number, email: string, tokenHash: string, expiresAt: Date): Promise<HouseholdInviteRecord> {
    const rows = await this.prisma.$queryRaw<HouseholdInviteRecord[]>(Prisma.sql`
      INSERT INTO household_invites (household_id, invited_by, email, token_hash, expires_at)
      VALUES (${householdId}, ${invitedBy}, ${email}, ${tokenHash}, ${expiresAt})
      RETURNING invite_id, household_id, invited_by, email, token_hash, expires_at, accepted_at, created_at
    `);
    return rows[0];
  }

  async findInviteByHash(tokenHash: string): Promise<HouseholdInviteRecord | null> {
    const rows = await this.prisma.$queryRaw<HouseholdInviteRecord[]>(Prisma.sql`
      SELECT invite_id, household_id, invited_by, email, token_hash, expires_at, accepted_at, created_at
      FROM household_invites
      WHERE token_hash = ${tokenHash}
    `);
    return rows[0] ?? null;
  }

  async acceptInvite(inviteId: number, householdId: number, userId: number): Promise<HouseholdMemberRecord | null> {
    const rows = await this.prisma.$queryRaw<HouseholdMemberRecord[]>(Prisma.sql`
      WITH consumed AS (
        UPDATE household_invites
        SET accepted_at = CURRENT_TIMESTAMP
        WHERE invite_id = ${inviteId}
          AND household_id = ${householdId}
          AND accepted_at IS NULL
          AND expires_at > CURRENT_TIMESTAMP
        RETURNING household_id
      )
      INSERT INTO household_members (household_id, user_id, role)
      SELECT household_id, ${userId}, 'MEMBER' FROM consumed
      ON CONFLICT (household_id, user_id) DO UPDATE SET role = household_members.role
      RETURNING member_id, household_id, user_id, role
    `);
    return rows[0] ?? null;
  }

  async findMemberById(householdId: number, memberId: number): Promise<HouseholdMemberRecord | null> {
    const rows = await this.prisma.$queryRaw<HouseholdMemberRecord[]>(Prisma.sql`
      SELECT member_id, household_id, user_id, role
      FROM household_members
      WHERE household_id = ${householdId} AND member_id = ${memberId}
    `);
    return rows[0] ?? null;
  }

  async countOwners(householdId: number): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ count: number | bigint }[]>(Prisma.sql`
      SELECT COUNT(*)::int AS count FROM household_members WHERE household_id = ${householdId} AND role = 'OWNER'
    `);
    return Number(rows[0]?.count ?? 0);
  }

  async updateMemberRole(householdId: number, memberId: number, role: HouseholdRole): Promise<HouseholdMemberRecord | null> {
    const rows = await this.prisma.$queryRaw<HouseholdMemberRecord[]>(Prisma.sql`
      UPDATE household_members SET role = ${role}, updated_at = CURRENT_TIMESTAMP
      WHERE household_id = ${householdId} AND member_id = ${memberId}
      RETURNING member_id, household_id, user_id, role
    `);
    return rows[0] ?? null;
  }

  async transferOwnership(householdId: number, currentOwnerUserId: number, memberId: number): Promise<HouseholdMemberRecord | null> {
    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE household_members SET role = 'MEMBER', updated_at = CURRENT_TIMESTAMP
      WHERE household_id = ${householdId} AND user_id = ${currentOwnerUserId} AND role = 'OWNER'
    `);
    return this.updateMemberRole(householdId, memberId, 'OWNER');
  }

  deleteMember(householdId: number, memberId: number): Promise<boolean> {
    return this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM household_members WHERE household_id = ${householdId} AND member_id = ${memberId}
    `).then((count) => count > 0);
  }
}
