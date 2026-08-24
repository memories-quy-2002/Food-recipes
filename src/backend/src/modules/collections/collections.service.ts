import {
  ConflictException,
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddCollectionRecipeDto } from './dto/add-collection-recipe.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import {
  CollectionRecord,
  CollectionRecipeRecord,
  COLLECTIONS_REPOSITORY,
  CollectionsRepositoryPort,
} from './collections.repository';

@Injectable()
export class CollectionsService {
  constructor(
    @Inject(COLLECTIONS_REPOSITORY)
    private readonly repository: CollectionsRepositoryPort,
  ) {}

  list(userId: number): Promise<{ collections: CollectionRecord[] }> {
    return this.repository.listByUserId(userId).then((collections) => ({ collections }));
  }

  async create(userId: number, dto: CreateCollectionDto): Promise<{ collection: CollectionRecord }> {
    const name = this.normalizeName(dto.name);
    try {
      return { collection: await this.repository.create(userId, name) };
    } catch (error) {
      this.throwCollectionConflict(error);
      throw error;
    }
  }

  async update(userId: number, collectionId: number, dto: UpdateCollectionDto): Promise<{ collection: CollectionRecord }> {
    const name = this.normalizeName(dto.name);
    try {
      const collection = await this.repository.update(userId, collectionId, name);
      if (!collection) throw this.notFound();
      return { collection };
    } catch (error) {
      this.throwCollectionConflict(error);
      throw error;
    }
  }

  async remove(userId: number, collectionId: number): Promise<{ message: string }> {
    if (!(await this.repository.remove(userId, collectionId))) throw this.notFound();
    return { message: 'Collection removed' };
  }

  async addRecipe(userId: number, collectionId: number, dto: AddCollectionRecipeDto): Promise<{ collection: CollectionRecord }> {
    await this.requireCollection(userId, collectionId);
    if (!(await this.repository.recipeExists(dto.recipeId))) {
      throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    }
    if (await this.repository.recipeInCollection(collectionId, dto.recipeId)) {
      throw new ConflictException({ code: 'COLLECTION_RECIPE_EXISTS', message: 'Recipe is already in this collection' });
    }
    if (!(await this.repository.addRecipe(collectionId, dto.recipeId))) {
      throw new ConflictException({ code: 'COLLECTION_RECIPE_EXISTS', message: 'Recipe is already in this collection' });
    }
    return { collection: (await this.repository.findOwned(userId, collectionId))! };
  }

  async removeRecipe(userId: number, collectionId: number, recipeId: number): Promise<{ message: string }> {
    await this.requireCollection(userId, collectionId);
    if (!(await this.repository.removeRecipe(userId, collectionId, recipeId))) {
      throw new NotFoundException({ code: 'COLLECTION_RECIPE_NOT_FOUND', message: 'Recipe is not in this collection' });
    }
    return { message: 'Recipe removed from collection' };
  }

  async listRecipes(userId: number, collectionId: number): Promise<{ recipes: CollectionRecipeRecord[] }> {
    await this.requireCollection(userId, collectionId);
    return { recipes: await this.repository.listRecipes(userId, collectionId) };
  }

  private async requireCollection(userId: number, collectionId: number): Promise<CollectionRecord> {
    const collection = await this.repository.findOwned(userId, collectionId);
    if (!collection) throw this.notFound();
    return collection;
  }

  private normalizeName(name: string): string {
    const normalized = name.trim();
    if (!normalized) throw new BadRequestException({ code: 'COLLECTION_NAME_EMPTY', message: 'Collection name cannot be empty' });
    return normalized;
  }

  private notFound(): NotFoundException {
    return new NotFoundException({ code: 'COLLECTION_NOT_FOUND', message: 'Collection not found' });
  }

  private throwCollectionConflict(error: unknown): void {
    const message = String((error as { message?: string })?.message ?? error);
    if (message.includes('saved_collections_user_name_key') || message.includes('23505')) {
      throw new ConflictException({ code: 'COLLECTION_NAME_EXISTS', message: 'Collection name already exists' });
    }
  }
}

export type CollectionsServicePort = Pick<CollectionsService, 'list' | 'create' | 'update' | 'remove' | 'addRecipe' | 'removeRecipe' | 'listRecipes'>;
