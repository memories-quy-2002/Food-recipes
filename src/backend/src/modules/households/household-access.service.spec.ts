import { ForbiddenException } from '@nestjs/common';
import { HouseholdAccessService } from './household-access.service';
import type { HouseholdsRepositoryPort } from './households.repository';

describe('HouseholdAccessService', () => {
  const repository: jest.Mocked<HouseholdsRepositoryPort> = {
    findMember: jest.fn(),
  };
  const service = new HouseholdAccessService(repository);

  beforeEach(() => jest.clearAllMocks());

  it('allows an owner action', async () => {
    repository.findMember.mockResolvedValue({ member_id: 1, household_id: 4, user_id: 7, role: 'OWNER' });

    await expect(service.requireRole(7, 4, ['OWNER'])).resolves.toBeUndefined();
  });

  it('allows a member action', async () => {
    repository.findMember.mockResolvedValue({ member_id: 2, household_id: 4, user_id: 8, role: 'MEMBER' });

    await expect(service.requireRole(8, 4, ['MEMBER'])).resolves.toBeUndefined();
  });

  it('allows a viewer read action', async () => {
    repository.findMember.mockResolvedValue({ member_id: 3, household_id: 4, user_id: 9, role: 'VIEWER' });

    await expect(service.requireRole(9, 4, ['OWNER', 'MEMBER', 'VIEWER'])).resolves.toBeUndefined();
  });

  it('denies a viewer mutation', async () => {
    repository.findMember.mockResolvedValue({ member_id: 3, household_id: 4, user_id: 9, role: 'VIEWER' });

    await expect(service.requireRole(9, 4, ['OWNER', 'MEMBER'])).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('denies an unrelated user', async () => {
    repository.findMember.mockResolvedValue(null);

    await expect(service.requireRole(99, 4, ['OWNER', 'MEMBER', 'VIEWER'])).rejects.toMatchObject({ response: { code: 'HOUSEHOLD_ACCESS_DENIED' } });
  });
});
