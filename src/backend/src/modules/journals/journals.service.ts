import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpsertJournalDto } from './dto/upsert-journal.dto';
import { JOURNALS_REPOSITORY, JournalsRepositoryPort } from './journals.repository';

@Injectable()
export class JournalsService {
  constructor(@Inject(JOURNALS_REPOSITORY) private readonly repository: JournalsRepositoryPort) {}

  async get(userId: number, historyId: number) {
    await this.assertOwnedHistory(userId, historyId);
    return { journal: await this.repository.find(userId, historyId) };
  }

  async upsert(userId: number, historyId: number, dto: UpsertJournalDto) {
    await this.assertOwnedHistory(userId, historyId);
    const current = await this.repository.find(userId, historyId);
    const journal = await this.repository.upsert(userId, historyId, {
        rating: dto.rating ?? current?.rating ?? null,
        wouldCookAgain: dto.wouldCookAgain ?? current?.would_cook_again ?? null,
        notes: dto.notes === undefined ? current?.notes ?? null : dto.notes.trim() || null,
    });
    if (dto.photos !== undefined) {
      const allowedPrefix = `journals/${userId}/`;
      const photos = dto.photos.filter((path) => path.startsWith(allowedPrefix)).slice(0, 10);
      await this.repository.replacePhotos(userId, historyId, photos);
      return { journal: (await this.repository.find(userId, historyId)) ?? journal };
    }
    return { journal };
  }

  private async assertOwnedHistory(userId: number, historyId: number) {
    if (!(await this.repository.historyBelongsToUser(userId, historyId))) {
      throw new NotFoundException({ code: 'COOKING_HISTORY_NOT_FOUND', message: 'Cooking history entry not found' });
    }
  }
}

export type JournalsServicePort = Pick<JournalsService, 'get' | 'upsert'>;
