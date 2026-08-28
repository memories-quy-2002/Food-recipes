import { BadRequestException, Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { RecipesService } from '../recipes/recipes.service';
import { RecipeFetcherService } from './recipe-fetcher.service';
import { parseRecipeJsonLd } from './recipe-jsonld.parser';
import type { CreateRecipeDraftDto } from '../recipes/dto/create-recipe-draft.dto';

@Injectable()
export class RecipeImportsService {
  constructor(
    private readonly fetcher: Pick<RecipeFetcherService, 'fetchHtml'>,
    @Inject(RecipesService) private readonly recipes: Pick<RecipesService, 'createDraft'>,
  ) {}

  async preview(url: string) {
    const fetched = await this.fetcher.fetchHtml(url);
    try {
      return { preview: { sourceUrl: fetched.url, ...parseRecipeJsonLd(fetched.html) } };
    } catch {
      throw new UnprocessableEntityException({ code: 'RECIPE_IMPORT_UNSUPPORTED_PAGE', message: 'This page does not expose a supported recipe' });
    }
  }

  saveDraft(userId: number, input: CreateRecipeDraftDto & { sourceUrl?: string }) {
    if (!input.name?.trim()) throw new BadRequestException({ code: 'RECIPE_IMPORT_NAME_REQUIRED', message: 'A recipe name is required before saving' });
    const { sourceUrl: _sourceUrl, ...draft } = input;
    return this.recipes.createDraft(userId, draft);
  }
}
