import { RatingsRepository } from './ratings.repository';

type SqlQuery = {
  strings: readonly string[];
  values: readonly unknown[];
};

const getQuery = (prisma: { $queryRaw: jest.Mock }, call = 0): SqlQuery =>
  prisma.$queryRaw.mock.calls[call][0] as SqlQuery;

describe('RatingsRepository', () => {
  it('binds recipe author lookup parameters in SQL', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ user_id: 42 }]),
    };
    const repository = new RatingsRepository(prisma as never);

    await expect(repository.findRecipeAuthorId(15)).resolves.toBe(42);

    const query = getQuery(prisma);
    expect(query.strings.join(' ')).toContain('FROM recipes');
    expect(query.strings.join(' ')).toContain('WHERE recipe_id =');
    expect(query.values).toEqual([15]);
  });

  it('binds user, recipe, score, and review parameters for upsert', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ overall_score: 4.5, num_ratings: 2 }]),
    };
    const repository = new RatingsRepository(prisma as never);

    await expect(repository.upsert(7, 15, 5, 'Great')).resolves.toEqual({
      aggregate: { overall_score: 4.5, num_ratings: 2 },
    });

    const query = getQuery(prisma);
    const sql = query.strings.join(' ');
    expect(sql).toContain('INSERT INTO rating');
    expect(sql).toContain('ON CONFLICT (user_id, recipe_id)');
    expect(sql).toContain('NOT EXISTS');
    expect(sql).toContain('UNION ALL');
    expect(sql).toContain('WHERE r.recipe_id =');
    expect(query.values).toEqual([7, 5, 'Great', 15, 15]);
  });

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
    expect(getQuery(prisma, 0).strings.join(' ')).toContain('WHERE rt.recipe_id =');
    expect(getQuery(prisma, 0).values).toEqual([15]);
    expect(getQuery(prisma, 1).strings.join(' ')).toContain('WHERE recipe_id =');
    expect(getQuery(prisma, 1).values).toEqual([15]);
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
    const query = getQuery(prisma);
    expect(query.strings.join(' ')).toContain('DELETE FROM rating');
    expect(query.strings.join(' ')).toContain('WHERE user_id =');
    expect(query.strings.join(' ')).toContain('AND recipe_id =');
    expect(query.values).toEqual([7, 15]);
  });

  it('binds the authenticated user for owned rating lookup', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    const repository = new RatingsRepository(prisma as never);

    await expect(repository.listByUserId(7)).resolves.toEqual([]);

    const query = getQuery(prisma);
    expect(query.strings.join(' ')).toContain('WHERE rt.user_id =');
    expect(query.values).toEqual([7]);
  });
});
