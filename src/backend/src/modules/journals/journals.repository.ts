import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export type CookingJournalRecord = {
  journal_id: number;
  history_id: number;
  user_id: number;
  rating: number | null;
  would_cook_again: boolean | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  photos?: Array<{ photo_id: number; object_path: string; created_at: Date }>;
};

export interface JournalsRepositoryPort {
  historyBelongsToUser(userId: number, historyId: number): Promise<boolean>;
  find(userId: number, historyId: number): Promise<CookingJournalRecord | null>;
  upsert(userId: number, historyId: number, input: { rating: number | null; wouldCookAgain: boolean | null; notes: string | null }): Promise<CookingJournalRecord>;
  replacePhotos(userId: number, historyId: number, objectPaths: string[]): Promise<void>;
}

export const JOURNALS_REPOSITORY = Symbol('JOURNALS_REPOSITORY');

@Injectable()
export class JournalsRepository implements JournalsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async historyBelongsToUser(userId: number, historyId: number): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ history_id: number }[]>(Prisma.sql`
      SELECT history_id FROM cooking_history WHERE history_id = ${historyId} AND user_id = ${userId}
    `);
    return rows.length > 0;
  }

  async find(userId: number, historyId: number): Promise<CookingJournalRecord | null> {
    const rows = await this.prisma.$queryRaw<CookingJournalRecord[]>(Prisma.sql`
      SELECT journal_id, history_id, user_id, rating, would_cook_again, notes, created_at, updated_at
      FROM cooking_journals WHERE history_id = ${historyId} AND user_id = ${userId}
    `);
    const journal = rows[0];
    if (!journal) return null;
    journal.photos = await this.prisma.$queryRaw<CookingJournalRecord['photos']>(Prisma.sql`
      SELECT photo_id, object_path, created_at FROM cooking_journal_photos
      WHERE journal_id = ${journal.journal_id} ORDER BY created_at ASC, photo_id ASC
    `);
    return journal;
  }

  async upsert(userId: number, historyId: number, input: { rating: number | null; wouldCookAgain: boolean | null; notes: string | null }): Promise<CookingJournalRecord> {
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO cooking_journals (history_id, user_id, rating, would_cook_again, notes)
      VALUES (${historyId}, ${userId}, ${input.rating}, ${input.wouldCookAgain}, ${input.notes})
      ON CONFLICT (history_id) DO UPDATE SET rating = EXCLUDED.rating, would_cook_again = EXCLUDED.would_cook_again,
        notes = EXCLUDED.notes, updated_at = CURRENT_TIMESTAMP
      WHERE cooking_journals.user_id = ${userId}
    `);
    return (await this.find(userId, historyId))!;
  }

  async replacePhotos(userId: number, historyId: number, objectPaths: string[]): Promise<void> {
    const journal = await this.prisma.$queryRaw<{ journal_id: number }[]>(Prisma.sql`
      SELECT journal_id FROM cooking_journals WHERE history_id = ${historyId} AND user_id = ${userId}
    `);
    if (!journal[0]) return;
    await this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw(Prisma.sql`DELETE FROM cooking_journal_photos WHERE journal_id = ${journal[0].journal_id}`);
      for (const objectPath of objectPaths) {
        await transaction.$executeRaw(Prisma.sql`
          INSERT INTO cooking_journal_photos (journal_id, object_path) VALUES (${journal[0].journal_id}, ${objectPath})
        `);
      }
    });
  }
}
