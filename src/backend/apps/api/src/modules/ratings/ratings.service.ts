import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MAX_REVIEW_LENGTH } from './dto/upsert-rating.dto';
import {
  RatingRecord,
  RatingsRepositoryPort,
  RATINGS_REPOSITORY,
  ReviewsResult,
} from './ratings.repository';

export type RatingInput = {
  score: number;
  review?: string;
};

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
  ): Promise<{
    message: string;
    aggregate: { overall_score: number; num_ratings: number };
  }> {
    this.validateInput(input);
    const recipeAuthorId = await this.repository.findRecipeAuthorId(recipeId);
    if (recipeAuthorId === null) {
      throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    }
    if (recipeAuthorId === userId) {
      throw new ForbiddenException({
        code: 'RECIPE_AUTHOR_CANNOT_REVIEW',
        message: 'Recipe authors cannot review their own recipes',
      });
    }

    const result = await this.repository.upsert(
      userId,
      recipeId,
      input.score,
      input.review?.trim() || null,
    );
    if (!result) {
      throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    }
    return { message: 'Rating saved successfully', aggregate: result.aggregate };
  }

  async remove(
    userId: number,
    recipeId: number,
  ): Promise<{
    message: string;
    aggregate: { overall_score: number; num_ratings: number };
  }> {
    const result = await this.repository.remove(userId, recipeId);
    if (!result) {
      throw new NotFoundException({ code: 'RATING_NOT_FOUND', message: 'Rating not found' });
    }
    return { message: 'Rating removed successfully', aggregate: result.aggregate };
  }

  async listMine(userId: number): Promise<{ ratings: RatingRecord[] }> {
    return { ratings: await this.repository.listByUserId(userId) };
  }

  async listReviews(recipeId: number): Promise<ReviewsResult> {
    return this.repository.listByRecipeId(recipeId);
  }

  private validateInput(input: RatingInput): void {
    if (!Number.isInteger(input.score) || input.score < 1 || input.score > 5) {
      throw new BadRequestException({
        code: 'INVALID_RATING_SCORE',
        message: 'Score must be an integer from 1 to 5',
      });
    }
    if (input.review !== undefined && input.review.length > MAX_REVIEW_LENGTH) {
      throw new BadRequestException({
        code: 'REVIEW_TOO_LONG',
        message: `Review must be ${MAX_REVIEW_LENGTH} characters or fewer`,
      });
    }
  }
}

export type RatingsServicePort = Pick<
  RatingsService,
  'upsert' | 'remove' | 'listMine' | 'listReviews'
>;

export { RATINGS_REPOSITORY } from './ratings.repository';
