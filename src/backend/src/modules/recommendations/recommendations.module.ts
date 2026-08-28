import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { CookingHistoryModule } from '../cooking-history/cooking-history.module';
import { PantryModule } from '../pantry/pantry.module';
import { PreferencesModule } from '../preferences/preferences.module';
import {
  RecommendationCandidatesRepository,
  RECOMMENDATION_CANDIDATES_REPOSITORY,
} from './recommendation-candidates.repository';
import { RecommendationContextService } from './recommendation-context.service';
import { RecommendationScorer } from './recommendation-scorer';
import { RECOMMENDATION_CONTEXT, RecommendationService } from './recommendation.service';

@Module({
  imports: [PrismaModule, PreferencesModule, PantryModule, CookingHistoryModule],
  providers: [
    RecommendationContextService,
    { provide: RECOMMENDATION_CONTEXT, useExisting: RecommendationContextService },
    RecommendationCandidatesRepository,
    { provide: RECOMMENDATION_CANDIDATES_REPOSITORY, useExisting: RecommendationCandidatesRepository },
    RecommendationScorer,
    RecommendationService,
  ],
  exports: [RecommendationService],
})
export class RecommendationsModule {}
