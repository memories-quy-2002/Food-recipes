import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RATINGS_REPOSITORY, RatingsService } from './ratings.service';

describe('RatingsService', () => {
  const repository = {
    findRecipeAuthorId: jest.fn(),
    upsert: jest.fn(),
    remove: jest.fn(),
    listByUserId: jest.fn(),
    listByRecipeId: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('upserts a rating for the authenticated user and returns the SQL aggregate', async () => {
    repository.findRecipeAuthorId.mockResolvedValue(15);
    repository.upsert.mockResolvedValue({
      aggregate: { overall_score: 4.5, num_ratings: 2 },
    });
    const service = new RatingsService(repository);

    await expect(service.upsert(7, 15, { score: 5, review: ' Great ' })).resolves.toEqual({
      message: 'Rating saved successfully',
      aggregate: { overall_score: 4.5, num_ratings: 2 },
    });
    expect(repository.upsert).toHaveBeenCalledWith(7, 15, 5, 'Great');
  });

  it('deletes only the authenticated user rating', async () => {
    repository.remove.mockResolvedValue({
      aggregate: { overall_score: 4, num_ratings: 1 },
    });
    const service = new RatingsService(repository);

    await expect(service.remove(7, 15)).resolves.toEqual({
      message: 'Rating removed successfully',
      aggregate: { overall_score: 4, num_ratings: 1 },
    });
    expect(repository.remove).toHaveBeenCalledWith(7, 15);
  });

  it('rejects a recipe author self-review with 403', async () => {
    repository.findRecipeAuthorId.mockResolvedValue(7);
    const service = new RatingsService(repository);

    await expect(service.upsert(7, 15, { score: 5 })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it('rejects an invalid score before touching persistence', async () => {
    const service = new RatingsService(repository);

    await expect(service.upsert(7, 15, { score: 5.5 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.findRecipeAuthorId).not.toHaveBeenCalled();
  });

  it('rejects a null review at the service boundary', async () => {
    const service = new RatingsService(repository);

    await expect(service.upsert(7, 15, { score: 5, review: null })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.findRecipeAuthorId).not.toHaveBeenCalled();
  });

  it('returns ratings owned by the authenticated user', async () => {
    repository.listByUserId.mockResolvedValue([{ rating_id: 1 }]);
    const service = new RatingsService(repository);

    await expect(service.listMine(7)).resolves.toEqual({ ratings: [{ rating_id: 1 }] });
    expect(repository.listByUserId).toHaveBeenCalledWith(7);
  });

  it('maps missing recipes to 404', async () => {
    repository.findRecipeAuthorId.mockResolvedValue(null);
    const service = new RatingsService(repository);

    await expect(service.upsert(7, 15, { score: 5 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('resolves through the stable Nest repository token', async () => {
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
