import { SuggestionsController } from './suggestions.controller';
import { SuggestionsService } from './suggestions.service';

describe('SuggestionsController', () => {
  it('passes public requests to the read-only service', async () => {
    const service = { suggest: jest.fn().mockResolvedValue({ suggestions: [] }) } as unknown as SuggestionsService;
    const controller = new SuggestionsController(service);

    await expect(controller.create({ intent: 'ingredient_match', ingredients: ['eggs'] })).resolves.toEqual({ suggestions: [] });
    expect(service.suggest).toHaveBeenCalledWith({ intent: 'ingredient_match', ingredients: ['eggs'] });
  });
});
