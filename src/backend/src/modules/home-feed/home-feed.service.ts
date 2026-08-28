import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  HomeFeedRepositoryPort,
  HOME_FEED_REPOSITORY,
} from './home-feed.repository';
import type {
  HomeFeedRecipe,
  KitchenActiveSession,
  KitchenNextMeal,
  KitchenState,
} from './home-feed.repository';
import { RecommendationService } from '../recommendations/recommendation.service';
import type { RecommendationServicePort } from '../recommendations/recommendation.service';

export type HomeFeedSectionKey =
  | 'continue'
  | 'use_soon'
  | 'recommended'
  | 'planned'
  | 'saved'
  | 'popular'
  | 'quick';

export type HomeFeedSectionContext = {
  active_session?: KitchenActiveSession | null;
  next_meal?: KitchenNextMeal | null;
};

export type HomeFeedSection = {
  key: HomeFeedSectionKey;
  title: string;
  description: string;
  recipes: HomeFeedRecipe[];
  context?: HomeFeedSectionContext;
};

export type HomeFeedResponse = {
  personalized: boolean;
  sections: HomeFeedSection[];
  kitchen?: KitchenState;
};

const section = (
  key: HomeFeedSectionKey,
  title: string,
  description: string,
  recipes: HomeFeedRecipe[],
  context?: HomeFeedSectionContext,
): HomeFeedSection => ({
  key,
  title,
  description,
  recipes,
  ...(context === undefined ? {} : { context }),
});

@Injectable()
export class HomeFeedService {
  constructor(
    @Inject(HOME_FEED_REPOSITORY)
    private readonly repository: HomeFeedRepositoryPort,
    @Optional()
    @Inject(RecommendationService)
    private readonly recommendationService?: RecommendationServicePort,
  ) {}

  async getPublicFeed(): Promise<HomeFeedResponse> {
    const [quick, popular] = await Promise.all([
      this.repository.listQuick(8),
      this.repository.listPopular(8),
    ]);

    return {
      personalized: false,
      sections: [
        section('quick', 'Quick wins', 'Short on time? Start with a recipe ready in 45 minutes or less.', quick),
        section('popular', 'Community favorites', 'Recipes other home cooks keep coming back to.', popular),
      ],
    };
  }

  async getPersonalizedFeed(userId: number): Promise<HomeFeedResponse> {
    const [plannedResult, useSoonResult, recommendedResult, savedResult, popularResult, kitchenResult] = await Promise.allSettled([
      this.repository.listPlanned(userId, 6),
      this.repository.listFromPantry(userId, 8),
      this.listRecommendedForHome(userId),
      this.repository.listSaved(userId, 6),
      this.repository.listPopular(8),
      this.repository.getKitchenState(userId),
    ]);

    const planned = settledValue(plannedResult, []);
    const useSoon = settledValue(useSoonResult, []);
    const recommended = settledValue(recommendedResult, []);
    const saved = settledValue(savedResult, []);
    const popular = settledValue(popularResult, []);
    const kitchen = kitchenResult.status === 'fulfilled' ? kitchenResult.value : undefined;

    return {
      personalized: true,
      kitchen,
      sections: [
        section('continue', 'Continue cooking', 'Resume the cooking session you left in progress.', [], { active_session: kitchen?.active_session ?? null }),
        section('use_soon', 'Use soon', 'Recipes ranked by ingredients you already have marked as available.', useSoon),
        section('recommended', 'Recommended for you', 'A small set of recipes shaped by the categories and meals you rated highly.', recommended),
        section('planned', 'On your plan next', 'Prepare the next meal you have planned.', planned, { next_meal: kitchen?.next_meal ?? null }),
        section('saved', 'Saved for later', 'Pick up one of the recipes you saved when you are ready to cook.', saved),
        section('popular', 'Explore what is popular', 'A little novelty from the wider recipe community.', popular),
      ],
    };
  }

  private async listRecommendedForHome(userId: number): Promise<HomeFeedRecipe[]> {
    if (!this.recommendationService) return [];
    const ranked = await this.recommendationService.recommend(userId, { limit: 8, surface: 'home' });
    const recipes = await this.repository.findPublishedByIds(ranked.map(({ recipeId }) => recipeId));
    const recipesById = new Map(recipes.map((recipe) => [recipe.recipe_id, recipe]));

    return ranked.flatMap((recommendation) => {
      const recipe = recipesById.get(recommendation.recipeId);
      return recipe
        ? [{
            ...recipe,
            recommendation_score: recommendation.score,
            reasons: recommendation.reasons,
          }]
        : [];
    });
  }
}

export type HomeFeedServicePort = Pick<HomeFeedService, 'getPublicFeed' | 'getPersonalizedFeed'>;

const settledValue = <T>(result: PromiseSettledResult<T>, fallback: T): T =>
  result.status === 'fulfilled' ? result.value : fallback;
