import { Injectable } from '@nestjs/common';

export type RatingInput = {
  score: number;
  review?: string;
};

export interface RatingsRepositoryPort {
  upsert(
    userId: number,
    recipeId: number,
    score: number,
    review?: string,
  ): Promise<void>;
  listByUserId(userId: number): Promise<unknown[]>;
}

@Injectable()
export class RatingsService {
  constructor(private readonly repository: RatingsRepositoryPort) {}

  async upsert(
    userId: number,
    recipeId: number,
    input: RatingInput,
  ): Promise<{ message: string }> {
    await this.repository.upsert(
      userId,
      recipeId,
      input.score,
      input.review,
    );
    return { message: 'Rating saved successfully' };
  }

  async listMine(userId: number): Promise<{ ratings: unknown[] }> {
    return { ratings: await this.repository.listByUserId(userId) };
  }
}
