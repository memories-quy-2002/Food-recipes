import { HomeFeedService } from './home-feed.service';
import type { HomeFeedRecipe, HomeFeedRepositoryPort, KitchenState } from './home-feed.repository';

describe('HomeFeedService', () => {
  const findPublishedByIds = jest.fn();
  const repository = {
    listPopular: jest.fn(),
    listQuick: jest.fn(),
    listSaved: jest.fn(),
    listPlanned: jest.fn(),
    listFromPantry: jest.fn(),
    listRecommended: jest.fn(),
    findPublishedByIds,
    getKitchenState: jest.fn(),
  } as unknown as jest.Mocked<HomeFeedRepositoryPort> & { findPublishedByIds: jest.Mock };
  const recommendationService = {
    recommend: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.listPopular.mockResolvedValue([]);
    repository.listQuick.mockResolvedValue([]);
    repository.listSaved.mockResolvedValue([]);
    repository.listPlanned.mockResolvedValue([]);
    repository.listFromPantry.mockResolvedValue([]);
    repository.listRecommended.mockResolvedValue([]);
    findPublishedByIds.mockResolvedValue([]);
    repository.getKitchenState.mockResolvedValue({
      active_session: null,
      next_meal: null,
      shopping: { open_items: 0, completed_items: 0 },
      pantry: { available_items: 0 },
      progress: { saved_recipes: 0, planned_meals: 0, completed_cooks: 0 },
    });
  });

  it('builds a public feed from quick and popular catalog sections', async () => {
    const service = new HomeFeedService(repository);

    await expect(service.getPublicFeed()).resolves.toMatchObject({
      personalized: false,
      sections: [
        { key: 'quick', title: 'Quick wins', recipes: [] },
        { key: 'popular', title: 'Community favorites', recipes: [] },
      ],
    });
    expect(repository.listQuick).toHaveBeenCalledWith(8);
    expect(repository.listPopular).toHaveBeenCalledWith(8);
    expect(repository.listRecommended).not.toHaveBeenCalled();
  });

  it('orders contextual sections and preserves recommendation ranking after hydration', async () => {
    const planned = [{ recipe_id: 3 }] as unknown as HomeFeedRecipe[];
    const useSoon = [{ recipe_id: 4 }] as unknown as HomeFeedRecipe[];
    const hydratedRecommendations = [{ recipe_id: 5 }, { recipe_id: 6 }] as unknown as HomeFeedRecipe[];
    const saved = [{ recipe_id: 6 }] as unknown as HomeFeedRecipe[];
    const kitchen = {
      active_session: { session_id: 9, recipe_id: 7, recipe_name: 'Soup', current_step: 2, total_steps: 5, status: 'paused' as const },
      next_meal: { item_id: 12, plan_id: 4, recipe_id: 3, recipe_name: 'Pasta', planned_date: '2026-08-29', slot: 'dinner', servings: 2 },
      shopping: { open_items: 0, completed_items: 0 },
      pantry: { available_items: 0 },
      progress: { saved_recipes: 1, planned_meals: 1, completed_cooks: 0 },
    } as unknown as KitchenState;
    repository.listPlanned.mockResolvedValue(planned);
    repository.listFromPantry.mockResolvedValue(useSoon);
    repository.listSaved.mockResolvedValue(saved);
    repository.getKitchenState.mockResolvedValue(kitchen);
    recommendationService.recommend.mockResolvedValue([
      { recipeId: 6, score: 0.91, reasons: ['Matches meals you rated highly.'] },
      { recipeId: 5, score: 0.72, reasons: ['Fits your cooking time.'] },
    ]);
    findPublishedByIds.mockResolvedValue(hydratedRecommendations);
    const service = new HomeFeedService(repository, recommendationService);

    const result = await service.getPersonalizedFeed(42);

    expect(result.personalized).toBe(true);
    expect(result.kitchen).toBe(kitchen);
    expect(result.sections.map((item) => item.key)).toEqual([
      'continue',
      'use_soon',
      'recommended',
      'planned',
      'saved',
      'popular',
    ]);
    expect(result.sections[0]).toMatchObject({ context: { active_session: kitchen.active_session }, recipes: [] });
    expect(result.sections[1].recipes).toBe(useSoon);
    expect(result.sections[2].recipes).toEqual([
      { ...hydratedRecommendations[1], recommendation_score: 0.91, reasons: ['Matches meals you rated highly.'] },
      { ...hydratedRecommendations[0], recommendation_score: 0.72, reasons: ['Fits your cooking time.'] },
    ]);
    expect(result.sections[3]).toMatchObject({ context: { next_meal: kitchen.next_meal }, recipes: planned });
    expect(repository.listPlanned).toHaveBeenCalledWith(42, 6);
    expect(repository.listFromPantry).toHaveBeenCalledWith(42, 8);
    expect(repository.listSaved).toHaveBeenCalledWith(42, 6);
    expect(recommendationService.recommend).toHaveBeenCalledWith(42, { limit: 8, surface: 'home' });
    expect(findPublishedByIds).toHaveBeenCalledWith([6, 5]);
    expect(repository.getKitchenState).toHaveBeenCalledWith(42);
  });

  it('keeps the home response available when optional personalized sections fail', async () => {
    const planned = [{ recipe_id: 3 }] as never;
    const saved = [{ recipe_id: 6 }] as never;
    repository.listPlanned.mockResolvedValue(planned);
    repository.listSaved.mockResolvedValue(saved);
    repository.listFromPantry.mockRejectedValue(new Error('pantry unavailable'));
    recommendationService.recommend.mockRejectedValue(new Error('recommendations unavailable'));

    const result = await new HomeFeedService(repository, recommendationService).getPersonalizedFeed(42);

    expect(result.sections).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'use_soon', recipes: [] }),
      expect.objectContaining({ key: 'recommended', recipes: [] }),
      expect.objectContaining({ key: 'planned', recipes: planned }),
      expect.objectContaining({ key: 'saved', recipes: saved }),
    ]));
    expect(result.sections.map((item) => item.key)).toEqual([
      'continue',
      'use_soon',
      'recommended',
      'planned',
      'saved',
      'popular',
    ]);
    expect(repository.listRecommended).not.toHaveBeenCalled();
  });

  it('returns the owned kitchen state alongside the personalized feed', async () => {
    const kitchen = {
      active_session: { session_id: 3, recipe_id: 15, recipe_name: 'Pasta', current_step: 2, total_steps: 5, status: 'paused' as const },
      next_meal: null,
      shopping: { open_items: 2, completed_items: 1 },
      pantry: { available_items: 4 },
      progress: { saved_recipes: 1, planned_meals: 1, completed_cooks: 0 },
    } as never;
    repository.getKitchenState.mockResolvedValue(kitchen);

    await expect(new HomeFeedService(repository).getPersonalizedFeed(42)).resolves.toMatchObject({ kitchen });
  });
});
