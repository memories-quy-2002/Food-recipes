import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { HouseholdAccessService } from './household-access.service';
import type { HouseholdsRepositoryPort } from './households.repository';
import { HouseholdsService } from './households.service';

const member = (role: 'OWNER' | 'MEMBER' | 'VIEWER' = 'OWNER') => ({ member_id: 1, household_id: 4, user_id: 7, role });

describe('HouseholdsService', () => {
  const repository: jest.Mocked<HouseholdsRepositoryPort> = {
    findMember: jest.fn(),
    createHousehold: jest.fn(),
    listForUser: jest.fn(),
    findForUser: jest.fn(),
    listMembers: jest.fn(),
    createInvite: jest.fn(),
    findInviteByHash: jest.fn(),
    acceptInvite: jest.fn(),
    findMemberById: jest.fn(),
    countOwners: jest.fn(),
    updateMemberRole: jest.fn(),
    transferOwnership: jest.fn(),
    deleteMember: jest.fn(),
  };
  let service: HouseholdsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HouseholdsService(repository, new HouseholdAccessService(repository));
  });

  it('returns the raw invite token while persisting only its hash', async () => {
    repository.findMember.mockResolvedValue(member());
    repository.createInvite.mockImplementation(async (_householdId, _invitedBy, email, tokenHash, expiresAt) => ({
      invite_id: 8,
      household_id: 4,
      invited_by: 7,
      email,
      token_hash: tokenHash,
      expires_at: expiresAt,
      accepted_at: null,
      created_at: new Date(),
    }));

    const result = await service.createInvite(7, 4, { email: 'Cook@Example.com' });
    const persistedHash = repository.createInvite.mock.calls[0][3];

    expect(result.token).not.toEqual(persistedHash);
    expect(persistedHash).toMatch(/^[a-f0-9]{64}$/);
    expect(repository.createInvite).toHaveBeenCalledWith(4, 7, 'cook@example.com', persistedHash, expect.any(Date));
  });

  it('rejects an expired invite', async () => {
    repository.findInviteByHash.mockResolvedValue({ invite_id: 8, household_id: 4, invited_by: 7, email: 'cook@example.com', token_hash: 'hash', expires_at: new Date(Date.now() - 1), accepted_at: null, created_at: new Date() });

    await expect(service.acceptInvite(8, 'cook@example.com', 'expired-token')).rejects.toMatchObject({ response: { code: 'HOUSEHOLD_INVITE_INVALID' } });
    expect(repository.acceptInvite).not.toHaveBeenCalled();
  });

  it('rejects a replayed invite', async () => {
    repository.findInviteByHash.mockResolvedValue({ invite_id: 8, household_id: 4, invited_by: 7, email: 'cook@example.com', token_hash: 'hash', expires_at: new Date(Date.now() + 60_000), accepted_at: new Date(), created_at: new Date() });

    await expect(service.acceptInvite(8, 'cook@example.com', 'replayed-token')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a non-owner invite attempt', async () => {
    repository.findMember.mockResolvedValue(member('MEMBER'));

    await expect(service.createInvite(7, 4, { email: 'cook@example.com' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.createInvite).not.toHaveBeenCalled();
  });

  it('prevents removing the final owner without transferring ownership', async () => {
    repository.findMember.mockResolvedValue(member());
    repository.findMemberById.mockResolvedValue(member());
    repository.countOwners.mockResolvedValue(1);

    await expect(service.removeMember(7, 4, 1)).rejects.toMatchObject({ response: { code: 'HOUSEHOLD_FINAL_OWNER_REQUIRED' } });
    expect(repository.deleteMember).not.toHaveBeenCalled();
  });
});
