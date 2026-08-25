import { Inject, Injectable } from '@nestjs/common';
import {
  HomeFeedRecipe,
  HomeFeedRepositoryPort,
  HOME_FEED_REPOSITORY,
} from './home-feed.repository';

export type HomeFeedSectionKey =
  | 'continue'
  | 'pantry'
  | 'recommended'
  | 'saved'
  | 'quick'
  | 'popular';

export type HomeFeedSection = {
  key: HomeFeedSectionKey;
  title: string;
  description: string;
  recipes: HomeFeedRecipe[];
};

export type HomeFeedResponse = {
  personalized: boolean;
  sections: HomeFeedSection[];
};

const section = (
  key: HomeFeedSectionKey,
  title: string,
  description: string,
  recipes: HomeFeedRecipe[],
): HomeFeedSection => ({ key, title, description, recipes });

@Injectable()
export class HomeFeedService {
  constructor(
    @Inject(HOME_FEED_REPOSITORY)
    private readonly repository: HomeFeedRepositoryPort,
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
    const [planned, pantry, recommended, saved, quick, popular] = await Promise.all([
      this.repository.listPlanned(userId, 6),
      this.repository.listFromPantry(userId, 8),
      this.repository.listRecommended(userId, 8),
      this.repository.listSaved(userId, 6),
      this.repository.listQuick(8),
      this.repository.listPopular(8),
    ]);

    return {
      personalized: true,
      sections: [
        section('continue', 'On your plan this week', 'Keep momentum with meals already planned for the next seven days.', planned),
        section('pantry', 'From your pantry', 'Recipes ranked by the ingredients you already have marked as available.', pantry),
        section('recommended', 'Recommended for you', 'A small set of recipes shaped by the categories and meals you rated highly.', recommended),
        section('saved', 'Saved for later', 'Pick up one of the recipes you saved when you are ready to cook.', saved),
        section('quick', 'Quick wins', 'Reliable ideas for busy days, ready in 45 minutes or less.', quick),
        section('popular', 'Explore what is popular', 'A little novelty from the wider recipe community.', popular),
      ],
    };
  }
}

export type HomeFeedServicePort = Pick<HomeFeedService, 'getPublicFeed' | 'getPersonalizedFeed'>;
