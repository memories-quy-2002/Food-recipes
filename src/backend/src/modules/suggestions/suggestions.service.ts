import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { RecommendationService } from '../recommendations/recommendation.service';
import type { RecommendationServicePort } from '../recommendations/recommendation.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { SuggestionResult, SuggestionsRepositoryPort, SUGGESTIONS_REPOSITORY } from './suggestions.repository';

export type SuggestionResponse = {
  intent: CreateSuggestionDto['intent'];
  source: 'catalog_rules';
  disclaimer: string;
  suggestions: SuggestionResult[];
};

const MAX_SUGGESTION_TEXT = 80;

@Injectable()
export class SuggestionsService {
  constructor(
    @Inject(SUGGESTIONS_REPOSITORY) private readonly repository: SuggestionsRepositoryPort,
    @Inject(RecommendationService) private readonly recommendationService: RecommendationServicePort,
  ) {}

  async suggest(dto: CreateSuggestionDto, userId?: number): Promise<SuggestionResponse> {
    let suggestions: SuggestionResult[];
    switch (dto.intent) {
      case 'ingredient_match':
        suggestions = await this.byIngredients(dto.ingredients);
        break;
      case 'substitution':
        suggestions = await this.bySubstitution(dto.recipeId, dto.ingredient);
        break;
      case 'personalized':
        if (!userId) throw new UnauthorizedException({ code: 'SUGGESTIONS_AUTH_REQUIRED', message: 'Sign in for personalized suggestions' });
        suggestions = await this.byRecommendations(userId, dto.intent);
        break;
      case 'meal_plan':
        if (!userId) throw new UnauthorizedException({ code: 'SUGGESTIONS_AUTH_REQUIRED', message: 'Sign in for meal-plan suggestions' });
        suggestions = await this.byRecommendations(userId, dto.intent);
        break;
      default:
        throw new BadRequestException({ code: 'SUGGESTION_INTENT_INVALID', message: 'Suggestion intent is not supported' });
    }

    return {
      intent: dto.intent,
      source: 'catalog_rules',
      disclaimer: 'Suggestions are based on existing catalog data. Verify ingredients and suitability before cooking; nothing was saved or changed.',
      suggestions: suggestions.map((suggestion) => ({
        ...suggestion,
        reason: suggestion.reason || this.defaultReason(dto.intent, suggestion.match_score),
      })),
    };
  }

  private defaultReason(intent: CreateSuggestionDto['intent'], matchScore: number): string {
    if (intent === 'ingredient_match') return `Matches ${matchScore} supplied ingredient${matchScore === 1 ? '' : 's'}.`;
    return 'Related catalog result; verify suitability before cooking.';
  }

  private async byIngredients(values: string[] | undefined): Promise<SuggestionResult[]> {
    if ((values?.length ?? 0) > 10) {
      throw new BadRequestException({ code: 'SUGGESTION_INGREDIENTS_LIMIT', message: 'Enter no more than 10 ingredients' });
    }
    const ingredients = this.normalizeList(values);
    if (!ingredients.length) throw new BadRequestException({ code: 'SUGGESTION_INGREDIENTS_REQUIRED', message: 'Enter at least one ingredient' });
    return this.repository.findByIngredients(ingredients);
  }

  private async bySubstitution(recipeId: number | undefined, ingredient: string | undefined): Promise<SuggestionResult[]> {
    if (!Number.isInteger(recipeId) || (recipeId as number) < 1) {
      throw new BadRequestException({ code: 'SUGGESTION_RECIPE_REQUIRED', message: 'A recipe is required for substitution suggestions' });
    }
    const normalizedIngredient = String(ingredient ?? '').trim().slice(0, MAX_SUGGESTION_TEXT);
    if (!normalizedIngredient) {
      throw new BadRequestException({ code: 'SUGGESTION_INGREDIENT_REQUIRED', message: 'Enter an ingredient to compare' });
    }
    return this.repository.findBySubstituteIngredient(recipeId as number, normalizedIngredient);
  }

  private async byRecommendations(
    userId: number,
    intent: Extract<CreateSuggestionDto['intent'], 'personalized' | 'meal_plan'>,
  ): Promise<SuggestionResult[]> {
    const ranked = await this.recommendationService.recommend(userId, {
      limit: 6,
      surface: intent === 'personalized' ? 'suggestions' : 'meal-plan',
    });
    const recipes = await this.repository.findByRecipeIds(ranked.map(({ recipeId }) => recipeId));
    const recipesById = new Map(recipes.map((recipe) => [recipe.recipe_id, recipe]));

    return ranked.flatMap((recommendation) => {
      const recipe = recipesById.get(recommendation.recipeId);
      return recipe
        ? [{ ...recipe, match_score: recommendation.score, reason: recommendation.reasons.join(' ') }]
        : [];
    });
  }

  private normalizeList(values: string[] | undefined): string[] {
    return [...new Set((values ?? []).map((value) => String(value).trim().toLowerCase()).filter(Boolean))];
  }
}

export type SuggestionsServicePort = Pick<SuggestionsService, 'suggest'>;
