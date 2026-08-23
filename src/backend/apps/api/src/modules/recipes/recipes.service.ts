import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RecipeQueryDto } from './dto/recipe-query.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeRecord, RecipesRepository, RecipesRepositoryPort } from './recipes.repository';

@Injectable()
export class RecipesService {
  constructor(
    @Inject(RecipesRepository)
    private readonly repository: RecipesRepositoryPort,
  ) {}

  async list(query: RecipeQueryDto): Promise<{ recipes: RecipeRecord[] }> {
    return { recipes: await this.repository.list(query) };
  }

  async findById(id: number): Promise<{ recipe: RecipeRecord }> {
    const recipe = await this.repository.findById(id);
    if (!recipe) {
      throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    }
    return { recipe };
  }

  async listMine(userId: number): Promise<{ recipes: RecipeRecord[] }> {
    return { recipes: await this.repository.findByUserId(userId) };
  }

  async create(userId: number, dto: CreateRecipeDto): Promise<{ recipe: RecipeRecord }> {
    return { recipe: await this.repository.create(userId, dto) };
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateRecipeDto,
  ): Promise<{ recipe: RecipeRecord }> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    if (existing.user_id !== userId) throw new ForbiddenException({ code: 'RECIPE_FORBIDDEN', message: 'You do not own this recipe' });
    return { recipe: await this.repository.update(id, dto) };
  }

  async delete(id: number, userId: number): Promise<void> {
    const recipe = await this.repository.findById(id);
    if (!recipe) throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    if (recipe.user_id !== userId) throw new ForbiddenException({ code: 'RECIPE_FORBIDDEN', message: 'You do not own this recipe' });
    await this.repository.delete(id);
  }
}
