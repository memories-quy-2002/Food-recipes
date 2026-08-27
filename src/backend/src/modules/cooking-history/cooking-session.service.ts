import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ActiveCookingSessionQueryDto } from './dto/active-cooking-session-query.dto';
import { CompleteCookingSessionDto } from './dto/complete-cooking-session.dto';
import { StartCookingSessionDto } from './dto/start-cooking-session.dto';
import { UpdateCookingSessionDto } from './dto/update-cooking-session.dto';
import {
  COOKING_SESSION_REPOSITORY,
  CookingSessionRecord,
  CookingSessionRepositoryPort,
  CompletedCookingSessionResult,
  ShoppingListHandoffResult,
} from './cooking-session.repository';

@Injectable()
export class CookingSessionService {
  constructor(
    @Inject(COOKING_SESSION_REPOSITORY)
    private readonly repository: CookingSessionRepositoryPort,
  ) {}

  async getActive(userId: number, query: ActiveCookingSessionQueryDto): Promise<{ session: CookingSessionRecord | null }> {
    return { session: await this.repository.findActive(userId, query.recipeId) };
  }

  async start(userId: number, dto: StartCookingSessionDto): Promise<{ session: CookingSessionRecord }> {
    if (!(await this.repository.recipeExists(dto.recipeId))) throw this.recipeNotFound();
    if (
      dto.mealPlanItemId !== undefined &&
      !(await this.repository.mealPlanItemBelongsToUser(userId, dto.mealPlanItemId, dto.recipeId))
    ) {
      throw this.planItemNotFound();
    }

    return {
      session: await this.repository.start(
        userId,
        dto.recipeId,
        dto.mealPlanItemId ?? null,
        dto.servings ?? null,
      ),
    };
  }

  async update(userId: number, sessionId: number, dto: UpdateCookingSessionDto): Promise<{ session: CookingSessionRecord }> {
    if (dto.currentStep === undefined && dto.status === undefined) {
      throw new BadRequestException({
        code: 'COOKING_SESSION_UPDATE_EMPTY',
        message: 'Provide a cooking step or session status to update',
      });
    }
    const session = await this.repository.update(userId, sessionId, dto.currentStep, dto.status);
    if (!session) throw this.sessionNotFound();
    return { session };
  }

  async complete(userId: number, sessionId: number, dto?: CompleteCookingSessionDto): Promise<CompletedCookingSessionResult | ShoppingListHandoffResult> {
    const result = await this.repository.complete(userId, sessionId, dto?.action);
    if (!result) throw this.sessionNotFound();
    if ('status' in result) {
      if (result.status === 'needs_confirmation') {
        throw new ConflictException({
          code: 'COOKING_PANTRY_SHORTAGE',
          message: 'Some ingredients are missing from your pantry',
          shortages: result.shortages,
        });
      }
      if (result.status === 'invalid_recipe') {
        throw new BadRequestException({
          code: 'COOKING_RECIPE_INGREDIENTS_UNQUANTIFIED',
          message: 'Add a quantity and unit to every recipe ingredient before cooking',
          ingredient_names: result.ingredient_names,
        });
      }
      return result;
    }
    return result;
  }

  async abandon(userId: number, sessionId: number): Promise<{ message: string }> {
    if (!(await this.repository.abandon(userId, sessionId))) throw this.sessionNotFound();
    return { message: 'Cooking session abandoned' };
  }

  private recipeNotFound(): NotFoundException {
    return new NotFoundException({ code: 'COOKING_SESSION_RECIPE_NOT_FOUND', message: 'Recipe not found' });
  }

  private planItemNotFound(): NotFoundException {
    return new NotFoundException({ code: 'COOKING_SESSION_PLAN_ITEM_NOT_FOUND', message: 'Meal plan item not found for this recipe and user' });
  }

  private sessionNotFound(): NotFoundException {
    return new NotFoundException({ code: 'COOKING_SESSION_NOT_FOUND', message: 'Cooking session not found or already finished' });
  }
}

export type CookingSessionServicePort = Pick<CookingSessionService, 'getActive' | 'start' | 'update' | 'complete' | 'abandon'>;
