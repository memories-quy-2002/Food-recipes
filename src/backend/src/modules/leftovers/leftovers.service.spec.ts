import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { LeftoversService } from './leftovers.service';
import type { LeftoversRepositoryPort } from './leftovers.repository';

describe('LeftoversService', () => {
  const repository: jest.Mocked<LeftoversRepositoryPort> = {
    findCompletedHistory: jest.fn(),
    findByHistory: jest.fn(),
    create: jest.fn(),
    listAvailable: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('creates an idempotent leftover from owned completed history', async () => {
    repository.findCompletedHistory.mockResolvedValue({ history_id: 4, user_id: 7, recipe_id: 15, recipe_name: 'Soup', servings: 4, completed_at: new Date('2026-08-30T10:00:00Z'), recipe_status: 'published', recipe_user_id: 99 });
    repository.findByHistory.mockResolvedValue(null);
    repository.create.mockResolvedValue({ leftover_id: 8, user_id: 7, household_id: null, recipe_id: 15, recipe_name: 'Soup', history_id: 4, cooked_servings: 4, remaining_servings: 2, prepared_at: new Date('2026-08-30T10:00:00Z'), expires_at: new Date('2026-09-02T10:00:00Z') });

    const service = new LeftoversService(repository);
    await expect(service.create(7, { cookingHistoryId: 4, servings: 2, expiresAt: '2026-09-02T10:00:00Z' })).resolves.toEqual(expect.objectContaining({ leftover: expect.anything() }));
    expect(repository.create).toHaveBeenCalledWith(7, null, 4, 15, 4, 2, new Date('2026-09-02T10:00:00Z'));
  });

  it('rejects servings above the cooked amount and expiry before preparation', async () => {
    repository.findCompletedHistory.mockResolvedValue({ history_id: 4, user_id: 7, recipe_id: 15, recipe_name: 'Soup', servings: 2, completed_at: new Date('2026-08-30T10:00:00Z'), recipe_status: 'published', recipe_user_id: 99 });
    const service = new LeftoversService(repository);
    await expect(service.create(7, { cookingHistoryId: 4, servings: 3, expiresAt: '2026-09-02T10:00:00Z' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create(7, { cookingHistoryId: 4, servings: 1, expiresAt: '2026-08-29T10:00:00Z' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a history owned by another user', async () => {
    repository.findCompletedHistory.mockResolvedValue({ history_id: 4, user_id: 8, recipe_id: 15, recipe_name: 'Soup', servings: 2, completed_at: new Date('2026-08-30T10:00:00Z'), recipe_status: 'published', recipe_user_id: 99 });
    await expect(new LeftoversService(repository).create(7, { cookingHistoryId: 4, servings: 1, expiresAt: '2026-09-02T10:00:00Z' })).rejects.toBeInstanceOf(ForbiddenException);
  });
});
