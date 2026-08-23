import { Inject, Injectable } from '@nestjs/common';

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

export const RATINGS_REPOSITORY = Symbol('RATINGS_REPOSITORY');

@Injectable()
export class RatingsService {
  constructor(
    @Inject(RATINGS_REPOSITORY)
    private readonly repository: RatingsRepositoryPort,
  ) {}

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
