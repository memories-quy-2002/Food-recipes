import { RatingsRepository } from './ratings.repository';

describe('RatingsRepository', () => {
  it('uses SQL aggregation for recipe review summaries', async () => {
    const prisma = {
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([
          {
            rating_id: 1,
            score: 5,
            review: 'Great',
            date_added: new Date('2026-08-23T00:00:00.000Z'),
            full_name: 'Ada Lovelace',
          },
        ])
        .mockResolvedValueOnce([{ overall_score: 4.5, num_ratings: 2 }]),
    };
    const repository = new RatingsRepository(prisma as never);

    await expect(repository.listByRecipeId(15)).resolves.toEqual({
      reviews: [expect.objectContaining({ rating_id: 1, score: 5 })],
      aggregate: { overall_score: 4.5, num_ratings: 2 },
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it('scopes deletion by both authenticated user and recipe', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ overall_score: 0, num_ratings: 0 }]),
    };
    const repository = new RatingsRepository(prisma as never);

    await expect(repository.remove(7, 15)).resolves.toEqual({
      aggregate: { overall_score: 0, num_ratings: 0 },
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });
});
