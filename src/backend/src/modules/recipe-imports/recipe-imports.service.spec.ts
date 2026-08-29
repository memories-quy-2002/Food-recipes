import { UnprocessableEntityException } from '@nestjs/common';
import { RecipeImportsService } from './recipe-imports.service';

describe('RecipeImportsService', () => {
  const fetcher = { fetchHtml: jest.fn() };
  const recipes = { createDraft: jest.fn() };
  const service = new RecipeImportsService(fetcher, recipes);

  beforeEach(() => jest.clearAllMocks());

  it('returns an editable preview from supported recipe JSON-LD', async () => {
    fetcher.fetchHtml.mockResolvedValue({ url: 'https://example.com/pasta', html: '<script type="application/ld+json">{"@type":"Recipe","name":"Pasta"}</script>' });
    await expect(service.preview('https://example.com/pasta')).resolves.toEqual({ preview: { sourceUrl: 'https://example.com/pasta', name: 'Pasta', ingredients: [], instructions: [] } });
  });

  it('maps imported data to the authenticated owner draft operation', async () => {
    recipes.createDraft.mockResolvedValue({ recipe: { recipe_id: 42, status: 'draft' } });
    await expect(service.saveDraft(7, { sourceUrl: 'https://example.com/pasta', name: 'Pasta', ingredients: ['200 g pasta'], instructions: ['Boil'] })).resolves.toEqual({ recipe: { recipe_id: 42, status: 'draft' } });
    expect(recipes.createDraft).toHaveBeenCalledWith(7, expect.objectContaining({ name: 'Pasta' }));
    expect(recipes.createDraft.mock.calls[0][1]).not.toHaveProperty('sourceUrl');
  });

  it('reports unsupported recipe pages without persisting anything', async () => {
    fetcher.fetchHtml.mockResolvedValue({ url: 'https://example.com/article', html: '<html />' });
    await expect(service.preview('https://example.com/article')).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(recipes.createDraft).not.toHaveBeenCalled();
  });
});
