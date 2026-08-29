import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type { CreateHouseholdDto } from './dto/create-household.dto';
import type { CreateHouseholdInviteDto } from './dto/create-household-invite.dto';
import type { UpdateHouseholdMemberDto } from './dto/update-household-member.dto';
import { HouseholdAccessService, type HouseholdRole } from './household-access.service';
import { HOUSEHOLDS_REPOSITORY, type HouseholdInviteRecord, type HouseholdMemberRecord, type HouseholdRecord, type HouseholdsRepositoryPort } from './households.repository';

const HOUSEHOLD_VIEW_ROLES: readonly HouseholdRole[] = ['OWNER', 'MEMBER', 'VIEWER'];
const HOUSEHOLD_OWNER_ROLES: readonly HouseholdRole[] = ['OWNER'];
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type HouseholdDetails = {
  household: HouseholdRecord;
  members: HouseholdMemberRecord[];
};

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

  async create(userId: number, dto: CreateHouseholdDto): Promise<{ household: HouseholdRecord }> {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException({ code: 'HOUSEHOLD_NAME_EMPTY', message: 'Household name cannot be empty' });
    return { household: await this.repository.createHousehold(userId, name) };
  }

  list(userId: number): Promise<{ households: HouseholdRecord[] }> {
    return this.repository.listForUser(userId).then((households) => ({ households }));
  }

  async get(userId: number, householdId: number): Promise<HouseholdDetails> {
    await this.access.requireRole(userId, householdId, HOUSEHOLD_VIEW_ROLES);
    const household = await this.repository.findForUser(userId, householdId);
    if (!household) throw this.notFound();
    return { household, members: await this.repository.listMembers(householdId) };
  }

  async createInvite(userId: number, householdId: number, dto: CreateHouseholdInviteDto) {
    await this.access.requireRole(userId, householdId, HOUSEHOLD_OWNER_ROLES);
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    const invite = await this.repository.createInvite(householdId, userId, dto.email.trim().toLowerCase(), tokenHash, expiresAt);
    return { invite: this.publicInvite(invite), token: rawToken };
  }

  async acceptInvite(userId: number, email: string, token: string) {
    const invite = await this.repository.findInviteByHash(this.hashToken(token));
    if (!invite || invite.accepted_at || invite.expires_at.getTime() <= Date.now()) throw this.inviteInvalid();
    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      throw new BadRequestException({ code: 'HOUSEHOLD_INVITE_EMAIL_MISMATCH', message: 'This invite was sent to a different email address' });
    }
    const member = await this.repository.acceptInvite(invite.invite_id, invite.household_id, userId);
    if (!member) throw this.inviteInvalid();
    return { household_id: invite.household_id, member };
  }

  async updateMember(userId: number, householdId: number, memberId: number, dto: UpdateHouseholdMemberDto) {
    await this.access.requireRole(userId, householdId, HOUSEHOLD_OWNER_ROLES);
    const member = await this.repository.findMemberById(householdId, memberId);
    if (!member) throw this.memberNotFound();
    if (member.role === 'OWNER' && dto.role !== 'OWNER' && await this.repository.countOwners(householdId) <= 1) {
      throw this.finalOwnerError();
    }
    const updated = member.role !== 'OWNER' && dto.role === 'OWNER'
      ? await this.repository.transferOwnership(householdId, userId, memberId)
      : await this.repository.updateMemberRole(householdId, memberId, dto.role);
    if (!updated) throw this.memberNotFound();
    return { member: updated };
  }

  async removeMember(userId: number, householdId: number, memberId: number) {
    await this.access.requireRole(userId, householdId, HOUSEHOLD_OWNER_ROLES);
    const member = await this.repository.findMemberById(householdId, memberId);
    if (!member) throw this.memberNotFound();
    if (member.role === 'OWNER' && await this.repository.countOwners(householdId) <= 1) throw this.finalOwnerError();
    if (!(await this.repository.deleteMember(householdId, memberId))) throw this.memberNotFound();
    return { message: 'Household member removed' };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private publicInvite(invite: HouseholdInviteRecord) {
    return {
      invite_id: invite.invite_id,
      household_id: invite.household_id,
      email: invite.email,
      expires_at: invite.expires_at,
      accepted_at: invite.accepted_at,
      created_at: invite.created_at,
    };
  }

  private notFound(): NotFoundException { return new NotFoundException({ code: 'HOUSEHOLD_NOT_FOUND', message: 'Household not found' }); }
  private memberNotFound(): NotFoundException { return new NotFoundException({ code: 'HOUSEHOLD_MEMBER_NOT_FOUND', message: 'Household member not found' }); }
  private inviteInvalid(): BadRequestException { return new BadRequestException({ code: 'HOUSEHOLD_INVITE_INVALID', message: 'This invite is invalid, expired, or already used' }); }
  private finalOwnerError(): BadRequestException { return new BadRequestException({ code: 'HOUSEHOLD_FINAL_OWNER_REQUIRED', message: 'Transfer ownership before removing or demoting the final owner' }); }
}

export type HouseholdsServicePort = Pick<HouseholdsService, 'findMember' | 'requireRole'>;
