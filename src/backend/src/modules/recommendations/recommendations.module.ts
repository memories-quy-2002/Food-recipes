import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { CookingHistoryModule } from '../cooking-history/cooking-history.module';
import { AuthModule } from '../auth/auth.module';
import { PantryModule } from '../pantry/pantry.module';
import { PreferencesModule } from '../preferences/preferences.module';
import {
  RecommendationCandidatesRepository,
  RECOMMENDATION_CANDIDATES_REPOSITORY,
} from './recommendation-candidates.repository';
import { RecommendationContextService } from './recommendation-context.service';
import { RecommendationScorer } from './recommendation-scorer';
import { RECOMMENDATION_CONTEXT, RecommendationService } from './recommendation.service';
import { NotInterestedController } from './not-interested.controller';
import { NotInterestedRepository, NOT_INTERESTED_REPOSITORY } from './not-interested.repository';
import { NotInterestedService } from './not-interested.service';

@Module({
  imports: [PrismaModule, AuthModule, PreferencesModule, PantryModule, CookingHistoryModule],
  controllers: [NotInterestedController],
  providers: [
    RecommendationContextService,
    { provide: RECOMMENDATION_CONTEXT, useExisting: RecommendationContextService },
    RecommendationCandidatesRepository,
    { provide: RECOMMENDATION_CANDIDATES_REPOSITORY, useExisting: RecommendationCandidatesRepository },
    RecommendationScorer,
    RecommendationService,
    NotInterestedRepository,
    { provide: NOT_INTERESTED_REPOSITORY, useExisting: NotInterestedRepository },
    NotInterestedService,
  ],
  exports: [
    RecommendationService,
    RecommendationContextService,
    RECOMMENDATION_CONTEXT,
    RecommendationCandidatesRepository,
    RECOMMENDATION_CANDIDATES_REPOSITORY,
    RecommendationScorer,
  ],
})
export class RecommendationsModule {}
