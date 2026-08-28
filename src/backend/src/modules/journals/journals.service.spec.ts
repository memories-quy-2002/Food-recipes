import { NotFoundException } from '@nestjs/common';
import type { JournalsRepositoryPort } from './journals.repository';
import { JournalsService } from './journals.service';

describe('JournalsService', () => {
  const repository: jest.Mocked<JournalsRepositoryPort> = {
    historyBelongsToUser: jest.fn(), find: jest.fn(), upsert: jest.fn(), replacePhotos: jest.fn(),
  };
  const service = new JournalsService(repository);

  beforeEach(() => jest.clearAllMocks());

  it('saves a private reflection without touching public recipe ratings', async () => {
    repository.historyBelongsToUser.mockResolvedValue(true);
    repository.find.mockResolvedValue(null);
    repository.upsert.mockResolvedValue({ journal_id: 3, history_id: 8, user_id: 7, rating: 5, would_cook_again: true, notes: 'Great', created_at: new Date(), updated_at: new Date() });
    await expect(service.upsert(7, 8, { rating: 5, wouldCookAgain: true, notes: ' Great ' })).resolves.toMatchObject({ journal: { rating: 5, would_cook_again: true, notes: 'Great' } });
    expect(repository.upsert).toHaveBeenCalledWith(7, 8, { rating: 5, wouldCookAgain: true, notes: 'Great' });
  });

  it('rejects another users history', async () => {
    repository.historyBelongsToUser.mockResolvedValue(false);
    await expect(service.get(7, 99)).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.find).not.toHaveBeenCalled();
  });

  it('preserves omitted fields when editing a journal', async () => {
    repository.historyBelongsToUser.mockResolvedValue(true);
    repository.find.mockResolvedValue({ journal_id: 3, history_id: 8, user_id: 7, rating: 4, would_cook_again: false, notes: 'Keep', created_at: new Date(), updated_at: new Date() });
    repository.upsert.mockResolvedValue({ journal_id: 3, history_id: 8, user_id: 7, rating: 4, would_cook_again: false, notes: 'Keep', created_at: new Date(), updated_at: new Date() });
    await service.upsert(7, 8, {});
    expect(repository.upsert).toHaveBeenCalledWith(7, 8, { rating: 4, wouldCookAgain: false, notes: 'Keep' });
  });
});
