import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  RECIPE_METADATA_REPOSITORY,
  RecipeMetadataRecord,
  RecipeMetadataRepositoryPort,
} from './recipe-metadata.repository';
import { UpsertRecipeMetadataDto } from './dto/recipe-metadata.dto';

export const validateRecipeMetadata = (dto: UpsertRecipeMetadataDto): void => {
  const nutrition = dto.nutrition;
  if (nutrition?.source === 'verified_external' && !nutrition.sourceReference?.trim()) {
    throw new BadRequestException({ code: 'METADATA_SOURCE_REFERENCE_REQUIRED', message: 'A source reference is required for verified external metadata' });
  }

  const allergens = dto.allergens ?? [];
  if (new Set(allergens.map((allergen) => allergen.name)).size !== allergens.length) {
    throw new BadRequestException({ code: 'DUPLICATE_ALLERGEN', message: 'Each allergen can only be declared once' });
  }

  for (const allergen of allergens) {
    if (allergen.source === 'verified_external' && !allergen.sourceReference?.trim()) {
      throw new BadRequestException({ code: 'METADATA_SOURCE_REFERENCE_REQUIRED', message: 'A source reference is required for verified external metadata' });
    }
  }
};

@Injectable()
export class RecipeMetadataService {
  constructor(
    @Inject(RECIPE_METADATA_REPOSITORY)
    private readonly repository: RecipeMetadataRepositoryPort,
  ) {}

  async get(recipeId: number): Promise<RecipeMetadataRecord> {
    if ((await this.repository.recipeOwnerId(recipeId)) === null) {
      throw this.notFound();
    }
    return this.repository.findByRecipeId(recipeId);
  }

  async replace(
    recipeId: number,
    userId: number,
    dto: UpsertRecipeMetadataDto,
  ): Promise<RecipeMetadataRecord> {
    const ownerId = await this.repository.recipeOwnerId(recipeId);
    if (ownerId === null) throw this.notFound();
    if (ownerId !== userId) {
      throw new ForbiddenException({ code: 'RECIPE_METADATA_FORBIDDEN', message: 'You do not own this recipe' });
    }

    const nutrition = dto.nutrition === undefined || dto.nutrition === null
      ? null
      : {
          ...dto.nutrition,
          sourceReference: dto.nutrition.sourceReference?.trim() || undefined,
        };
    const allergens = (dto.allergens ?? []).map((allergen) => ({
      ...allergen,
      sourceReference: allergen.sourceReference?.trim() || undefined,
    }));
    validateRecipeMetadata(dto);

    return this.repository.replace(recipeId, nutrition, allergens);
  }

  private notFound(): NotFoundException {
    return new NotFoundException({ code: 'RECIPE_METADATA_NOT_FOUND', message: 'Recipe not found' });
  }
}

export type RecipeMetadataServicePort = Pick<RecipeMetadataService, 'get' | 'replace'>;
