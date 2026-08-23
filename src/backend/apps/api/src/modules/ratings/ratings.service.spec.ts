import { Test } from '@nestjs/testing';
import { RATINGS_REPOSITORY, RatingsService } from './ratings.service';

describe('RatingsService', () => {
  const repository = {
    upsert: jest.fn(),
    listByUserId: jest.fn(),
    listByRecipeId: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('upserts a rating for the authenticated user', async () => {
    repository.upsert.mockResolvedValue(undefined);
    const service = new RatingsService(repository);

    await expect(service.upsert(7, 15, { score: 5, review: 'Great' })).resolves.toEqual({
      message: 'Rating saved successfully',
    });
    expect(repository.upsert).toHaveBeenCalledWith(7, 15, 5, 'Great');
  });

  it('returns the authenticated user ratings', async () => {
    repository.listByUserId.mockResolvedValue([{ rating_id: 1 }]);
    const service = new RatingsService(repository);

    await expect(service.listMine(7)).resolves.toEqual({
      ratings: [{ rating_id: 1 }],
    });
  });

  it('resolves the repository through the stable Nest injection token', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RatingsService,
        { provide: RATINGS_REPOSITORY, useValue: repository },
      ],
    }).compile();

    expect(moduleRef.get(RatingsService)).toBeInstanceOf(RatingsService);
    await moduleRef.close();
  });
});
