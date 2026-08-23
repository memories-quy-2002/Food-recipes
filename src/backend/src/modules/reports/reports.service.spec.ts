import { ConflictException, NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import type { ReportsRepositoryPort } from './reports.repository';

describe('ReportsService', () => {
  const repository: jest.Mocked<ReportsRepositoryPort> = {
    ratingBelongsToRecipe: jest.fn(),
    openReportExists: jest.fn(),
    create: jest.fn(),
    list: jest.fn(),
    resolve: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('requires the rating to belong to the route recipe', async () => {
    repository.ratingBelongsToRecipe.mockResolvedValue(false);
    const service = new ReportsService(repository);

    await expect(service.create(7, 15, 21, { reason: 'spam' })).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects a second open report by the same user', async () => {
    repository.ratingBelongsToRecipe.mockResolvedValue(true);
    repository.openReportExists.mockResolvedValue(true);
    const service = new ReportsService(repository);

    await expect(service.create(7, 15, 21, { reason: 'abuse' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('trims optional report details', async () => {
    repository.ratingBelongsToRecipe.mockResolvedValue(true);
    repository.openReportExists.mockResolvedValue(false);
    repository.create.mockResolvedValue({
      report_id: 9,
      rating_id: 21,
      recipe_id: 15,
      reporter_user_id: 7,
      reason: 'other',
      details: 'Useful context',
      status: 'open',
      created_at: new Date(),
    });
    const service = new ReportsService(repository);

    await service.create(7, 15, 21, { reason: 'other', details: '  Useful context  ' });

    expect(repository.create).toHaveBeenCalledWith(15, 21, 7, 'other', 'Useful context');
  });
});
