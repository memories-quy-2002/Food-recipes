import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { CreateRecipeDraftDto } from './dto/create-recipe-draft.dto';
import { RecipeQueryDto } from './dto/recipe-query.dto';
import {
  MAX_RECIPE_INGREDIENTS,
  MAX_RECIPE_TAGS,
  RecipeStatus,
  RecipeStatusFilter,
  ReplaceRecipeIngredientsDto,
  ReplaceRecipeNutritionDto,
  ReplaceRecipeTagsDto,
} from './dto/recipe-structure.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import {
  RecipeListResult,
  RecipeRecord,
  RecipesRepository,
  RecipesRepositoryPort,
} from './recipes.repository';

@Injectable()
export class RecipesService {
  constructor(
    @Inject(RecipesRepository)
    private readonly repository: RecipesRepositoryPort,
  ) {}

  async list(query: RecipeQueryDto): Promise<RecipeListResult> {
    return this.repository.list(query);
  }

  async findById(id: number): Promise<{ recipe: RecipeRecord }> {
    const recipe = await this.repository.findById(id);
    if (!recipe) {
      throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    }
    return { recipe };
  }

  async listMine(
    userId: number,
    status: RecipeStatusFilter = 'all',
  ): Promise<{ recipes: RecipeRecord[] }> {
    return { recipes: await this.repository.findByUserId(userId, status) };
  }

  async create(userId: number, dto: CreateRecipeDto): Promise<{ recipe: RecipeRecord }> {
    return { recipe: await this.repository.create(userId, dto) };
  }

  async createDraft(
    userId: number,
    dto: CreateRecipeDraftDto,
  ): Promise<{ recipe: RecipeRecord }> {
    return { recipe: await this.repository.createDraft(userId, dto) };
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateRecipeDto,
  ): Promise<{ recipe: RecipeRecord }> {
    const ownerLookup = await this.repository.findByIdForOwner(id);
    const existing = ownerLookup ?? (ownerLookup === undefined ? await this.repository.findById(id) : null);
    if (!existing) throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    if (existing.user_id !== userId) throw new ForbiddenException({ code: 'RECIPE_FORBIDDEN', message: 'You do not own this recipe' });
    return { recipe: await this.repository.update(id, dto) };
  }

  async delete(id: number, userId: number): Promise<void> {
    const ownerLookup = await this.repository.findByIdForOwner(id);
    const recipe = ownerLookup ?? (ownerLookup === undefined ? await this.repository.findById(id) : null);
    if (!recipe) throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    if (recipe.user_id !== userId) throw new ForbiddenException({ code: 'RECIPE_FORBIDDEN', message: 'You do not own this recipe' });
    await this.repository.delete(id);
  }

  async replaceIngredients(
    id: number,
    userId: number,
    dto: ReplaceRecipeIngredientsDto,
  ): Promise<{ recipe: RecipeRecord }> {
    await this.requireOwner(id, userId);
    if (!Array.isArray(dto.ingredients) || dto.ingredients.length > MAX_RECIPE_INGREDIENTS) {
      throw new BadRequestException({
        code: 'RECIPE_INGREDIENTS_INVALID',
        message: `A recipe may contain at most ${MAX_RECIPE_INGREDIENTS} ingredients`,
      });
    }
    for (const ingredient of dto.ingredients) {
      if (!ingredient.name?.trim()) {
        throw new BadRequestException({
          code: 'RECIPE_INGREDIENT_NAME_REQUIRED',
          message: 'Each ingredient must have a non-empty name',
        });
      }
      if (
        ingredient.quantity !== undefined &&
        ingredient.quantity !== null &&
        (!Number.isFinite(ingredient.quantity) || ingredient.quantity < 0)
      ) {
        throw new BadRequestException({
          code: 'RECIPE_INGREDIENT_QUANTITY_INVALID',
          message: 'Ingredient quantity must be zero or greater',
        });
      }
    }
    return { recipe: await this.repository.replaceIngredients(id, dto.ingredients) };
  }

  async replaceNutrition(
    id: number,
    userId: number,
    dto: ReplaceRecipeNutritionDto,
  ): Promise<{ recipe: RecipeRecord }> {
    await this.requireOwner(id, userId);
    const values = [
      dto.calories,
      dto.protein,
      dto.carbohydrates,
      dto.fat,
      dto.fiber,
      dto.sugar,
      dto.sodium,
    ];
    const hasValues = (dto.servings !== undefined && dto.servings !== null) || values.some((value) => value !== undefined && value !== null);
    if (!hasValues) return { recipe: await this.repository.replaceNutrition(id, null) };
    if (!dto.servings || dto.servings < 1) {
      throw new BadRequestException({
        code: 'RECIPE_NUTRITION_SERVINGS_REQUIRED',
        message: 'Nutrition values require a positive servings value',
      });
    }
    if (values.some((value) => value !== undefined && value !== null && (!Number.isFinite(value) || value < 0))) {
      throw new BadRequestException({
        code: 'RECIPE_NUTRITION_VALUE_INVALID',
        message: 'Nutrition values must be zero or greater',
      });
    }
    return { recipe: await this.repository.replaceNutrition(id, dto) };
  }

  async replaceTags(
    id: number,
    userId: number,
    dto: ReplaceRecipeTagsDto,
  ): Promise<{ recipe: RecipeRecord }> {
    await this.requireOwner(id, userId);
    const dietaryTags = this.normalizeTags(dto.dietaryTags, 'dietary');
    const allergenTags = this.normalizeTags(dto.allergenTags, 'allergen');
    return {
      recipe: await this.repository.replaceTags(id, { dietaryTags, allergenTags }),
    };
  }

  async publish(id: number, userId: number): Promise<{ recipe: RecipeRecord }> {
    const recipe = await this.requireOwner(id, userId);
    if (recipe.status === 'published') return { recipe };
    if (recipe.status !== 'draft') {
      throw new BadRequestException({
        code: 'RECIPE_STATUS_INVALID',
        message: 'Only draft recipes can be published',
      });
    }
    const hasStructuredIngredient = recipe.structured_ingredients?.some(
      (ingredient) => ingredient.name?.trim(),
    );
    const hasLegacyIngredient = recipe.ingredients?.some((ingredient) => ingredient?.trim());
    const hasInstruction = recipe.instructions?.some((instruction) => instruction?.trim());
    if (
      !recipe.recipe_name?.trim() ||
      !recipe.category_id ||
      !recipe.meal_id ||
      !recipe.prep_time_minutes ||
      recipe.prep_time_minutes < 1 ||
      !recipe.cook_time_minutes ||
      recipe.cook_time_minutes < 1 ||
      (!hasStructuredIngredient && !hasLegacyIngredient) ||
      !hasInstruction ||
      !recipe.image_url?.trim()
    ) {
      throw new BadRequestException({
        code: 'RECIPE_PUBLISH_REQUIREMENTS_NOT_MET',
        message:
          'Publishing requires name, category, meal, positive preparation and cooking times, an ingredient, an instruction, and an image',
      });
    }
    return { recipe: await this.repository.publish(id) };
  }

  async archive(id: number, userId: number): Promise<{ recipe: RecipeRecord }> {
    const recipe = await this.requireOwner(id, userId);
    if (recipe.status !== 'published') {
      throw new BadRequestException({
        code: 'RECIPE_STATUS_INVALID',
        message: 'Only published recipes can be archived',
      });
    }
    return { recipe: await this.repository.archive(id) };
  }

  async restore(id: number, userId: number): Promise<{ recipe: RecipeRecord }> {
    const recipe = await this.requireOwner(id, userId);
    if (recipe.status !== 'archived') {
      throw new BadRequestException({
        code: 'RECIPE_STATUS_INVALID',
        message: 'Only archived recipes can be restored',
      });
    }
    return { recipe: await this.repository.restore(id) };
  }

  private async requireOwner(id: number, userId: number): Promise<RecipeRecord> {
    const recipe = await this.repository.findByIdForOwner(id);
    if (!recipe) {
      throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    }
    if (recipe.user_id !== userId) {
      throw new ForbiddenException({
        code: 'RECIPE_FORBIDDEN',
        message: 'You do not own this recipe',
      });
    }
    return recipe;
  }

  private normalizeTags(tags: string[] | undefined, kind: string): string[] {
    if (!tags) return [];
    if (tags.length > MAX_RECIPE_TAGS) {
      throw new BadRequestException({
        code: 'RECIPE_TAGS_INVALID',
        message: `A recipe may contain at most ${MAX_RECIPE_TAGS} ${kind} tags`,
      });
    }
    const normalized = tags.map((tag) => tag.trim());
    if (normalized.some((tag) => !tag)) {
      throw new BadRequestException({
        code: 'RECIPE_TAG_REQUIRED',
        message: 'Recipe tags must be non-empty',
      });
    }
    return [...new Set(normalized)];
  }
}
