import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCookingHistoryDto } from './dto/create-cooking-history.dto';
import { COOKING_HISTORY_REPOSITORY, CookingHistoryRecord, CookingHistoryRepositoryPort } from './cooking-history.repository';

const HISTORY_LIMIT = 100;

@Injectable()
export class CookingHistoryService {
  constructor(@Inject(COOKING_HISTORY_REPOSITORY) private readonly repository: CookingHistoryRepositoryPort) {}

  async list(userId: number): Promise<{ items: CookingHistoryRecord[] }> {
    return { items: await this.repository.list(userId, HISTORY_LIMIT) };
  }

  async create(userId: number, dto: CreateCookingHistoryDto): Promise<{ item: CookingHistoryRecord }> {
    if (!(await this.repository.recipeExists(dto.recipeId))) throw this.recipeNotFound();
    if (dto.mealPlanItemId !== undefined && !(await this.repository.mealPlanItemBelongsToUser(userId, dto.mealPlanItemId, dto.recipeId))) {
      throw this.planItemNotFound();
    }

    const startedAt = this.parseTimestamp(dto.startedAt) ?? new Date();
    const completedAt = this.parseTimestamp(dto.completedAt) ?? new Date();
    if (completedAt < startedAt) throw new BadRequestException({ code: 'COOKING_HISTORY_TIME_INVALID', message: 'Completion time must be after the start time' });

    return {
      item: await this.repository.create(userId, dto.recipeId, dto.mealPlanItemId ?? null, dto.servings ?? 1, startedAt, completedAt),
    };
  }

  private parseTimestamp(value?: string): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new BadRequestException({ code: 'COOKING_HISTORY_TIME_INVALID', message: 'Cooking history timestamps must be valid dates' });
    return parsed;
  }

  private recipeNotFound(): NotFoundException {
    return new NotFoundException({ code: 'COOKING_HISTORY_RECIPE_NOT_FOUND', message: 'Recipe not found' });
  }

  private planItemNotFound(): NotFoundException {
    return new NotFoundException({ code: 'COOKING_HISTORY_PLAN_ITEM_NOT_FOUND', message: 'Meal plan item not found for this recipe and user' });
  }
}

export type CookingHistoryServicePort = Pick<CookingHistoryService, 'list' | 'create'>;
