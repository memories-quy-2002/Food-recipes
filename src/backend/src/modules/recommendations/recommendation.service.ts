import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  RECOMMENDATION_CANDIDATE_LIMIT,
  RecommendationCandidate,
  RecommendationCandidatesRepositoryPort,
  RECOMMENDATION_CANDIDATES_REPOSITORY,
} from './recommendation-candidates.repository';
import {
  RecommendationContextServicePort,
  RecommendationContext,
} from './recommendation-context.service';
import {
  RecommendationScore,
  RecommendationScorer,
} from './recommendation-scorer';
import { RECOMMENDATION_CONTEXT } from './recommendations.tokens';

export type RecommendationSurface = 'home' | 'suggestions' | 'meal-plan';

export type RankedRecipe = {
  recipeId: number;
  score: number;
  reasons: string[];
};

export type RecommendationServiceInput = {
  limit: number;
  surface: RecommendationSurface;
};

const MAX_RECOMMENDATIONS = 8;
const SURFACES: readonly RecommendationSurface[] = ['home', 'suggestions', 'meal-plan'];

const isSurface = (surface: string): surface is RecommendationSurface =>
  SURFACES.includes(surface as RecommendationSurface);

const scoreCandidate = (
  candidate: RecommendationCandidate,
  context: RecommendationContext,
  scorer: RecommendationScorer,
  surface: RecommendationSurface,
): RecommendationScore => scorer.score(candidate, context, { excludeOwnRecipe: surface !== 'meal-plan' });

@Injectable()
export class RecommendationService {
  constructor(
    @Inject(RECOMMENDATION_CONTEXT)
    private readonly contextService: RecommendationContextServicePort,
    @Inject(RECOMMENDATION_CANDIDATES_REPOSITORY)
    private readonly candidatesRepository: RecommendationCandidatesRepositoryPort,
    private readonly scorer: RecommendationScorer,
  ) {}

  async recommend(userId: number, input: RecommendationServiceInput): Promise<RankedRecipe[]> {
    if (!Number.isInteger(input?.limit) || input.limit < 1) {
      throw new BadRequestException({
        code: 'RECOMMENDATION_LIMIT_INVALID',
        message: 'Recommendation limit must be a positive integer',
      });
    }
    if (!isSurface(input.surface)) {
      throw new BadRequestException({
        code: 'RECOMMENDATION_SURFACE_INVALID',
        message: 'Recommendation surface is not supported',
      });
    }

    const limit = Math.min(
      input.limit,
      input.surface === 'home' ? MAX_RECOMMENDATIONS : RECOMMENDATION_CANDIDATE_LIMIT,
    );
    const [context, candidates] = await Promise.all([
      this.contextService.build(userId),
      this.candidatesRepository.listPublished(RECOMMENDATION_CANDIDATE_LIMIT),
    ]);

    return candidates
      .map((candidate) => ({
        candidate,
        result: scoreCandidate(candidate, context, this.scorer, input.surface),
      }))
      .filter(({ result }) => !result.excluded)
      .sort((left, right) => right.result.score - left.result.score || left.candidate.recipeId - right.candidate.recipeId)
      .slice(0, limit)
      .map(({ candidate, result }) => ({
        recipeId: candidate.recipeId,
        score: result.score,
        reasons: result.reasons,
      }));
  }
}

export interface RecommendationServicePort {
  recommend(userId: number, input: RecommendationServiceInput): Promise<RankedRecipe[]>;
}

export { RECOMMENDATION_CONTEXT } from './recommendations.tokens';
