import { BadRequestException, Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { RecipesService } from '../recipes/recipes.service';
import { RecipeFetcherService } from './recipe-fetcher.service';
import { parseRecipeJsonLd } from './recipe-jsonld.parser';
import type { CreateRecipeDraftDto } from '../recipes/dto/create-recipe-draft.dto';
import { workflowTelemetry } from '../../common/telemetry/workflow-telemetry.service';

@Injectable()
export class RecipeImportsService {
  constructor(
    @Inject(RecipeFetcherService) private readonly fetcher: Pick<RecipeFetcherService, 'fetchHtml'>,
    @Inject(RecipesService) private readonly recipes: Pick<RecipesService, 'createDraft'>,
  ) {}

  async preview(url: string) {
    const fetched = await workflowTelemetry.run('recipe_import.fetch', { surface: 'recipe-import' }, () => this.fetcher.fetchHtml(url));
    try {
      const parsed = await workflowTelemetry.run('recipe_import.parse', { surface: 'recipe-import' }, async () => parseRecipeJsonLd(fetched.html));
      return { preview: { sourceUrl: fetched.url, ...parsed } };
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
