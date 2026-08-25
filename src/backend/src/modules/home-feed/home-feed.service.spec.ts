import { HomeFeedService } from './home-feed.service';
import type { HomeFeedRepositoryPort } from './home-feed.repository';

describe('HomeFeedService', () => {
  const repository: jest.Mocked<HomeFeedRepositoryPort> = {
    listPopular: jest.fn(),
    listQuick: jest.fn(),
    listSaved: jest.fn(),
    listPlanned: jest.fn(),
    listFromPantry: jest.fn(),
    listRecommended: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.listPopular.mockResolvedValue([]);
    repository.listQuick.mockResolvedValue([]);
    repository.listSaved.mockResolvedValue([]);
    repository.listPlanned.mockResolvedValue([]);
    repository.listFromPantry.mockResolvedValue([]);
    repository.listRecommended.mockResolvedValue([]);
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

  it('combines user signals with catalog fallbacks without mutating the source data', async () => {
    const planned = [{ recipe_id: 3 }] as never;
    const pantry = [{ recipe_id: 4 }] as never;
    const recommended = [{ recipe_id: 5 }] as never;
    const saved = [{ recipe_id: 6 }] as never;
    repository.listPlanned.mockResolvedValue(planned);
    repository.listFromPantry.mockResolvedValue(pantry);
    repository.listRecommended.mockResolvedValue(recommended);
    repository.listSaved.mockResolvedValue(saved);
    const service = new HomeFeedService(repository);

    const result = await service.getPersonalizedFeed(42);

    expect(result.personalized).toBe(true);
    expect(result.sections.map((item) => item.key)).toEqual([
      'continue',
      'pantry',
      'recommended',
      'saved',
      'quick',
      'popular',
    ]);
    expect(result.sections[0].recipes).toBe(planned);
    expect(result.sections[1].recipes).toBe(pantry);
    expect(repository.listPlanned).toHaveBeenCalledWith(42, 6);
    expect(repository.listFromPantry).toHaveBeenCalledWith(42, 8);
    expect(repository.listRecommended).toHaveBeenCalledWith(42, 8);
    expect(repository.listSaved).toHaveBeenCalledWith(42, 6);
  });
});
