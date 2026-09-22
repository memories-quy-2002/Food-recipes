import { Inject, Injectable } from '@nestjs/common';
import { COOKING_INSIGHTS_REPOSITORY, CookingInsightsRepositoryPort } from './cooking-insights.repository';

@Injectable()
export class CookingInsightsService {
  constructor(@Inject(COOKING_INSIGHTS_REPOSITORY) private readonly repository: CookingInsightsRepositoryPort) {}

  getRecap(userId: number) {
    return this.repository.getRecap(userId);
  }

  getRecipeMemory(userId: number, recipeId: number) {
    return this.repository.getRecipeMemory(userId, recipeId);
  }
}

export type CookingInsightsServicePort = Pick<CookingInsightsService, 'getRecap' | 'getRecipeMemory'>;
