import { recipeOrderBySql, RecipesRepository } from './recipes.repository';

const sqlSource = (query: { strings: readonly string[] }) =>
  query.strings.join(' ');

describe('RecipesRepository duration normalization', () => {
  const prisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const recipe = {
    recipe_id: 15,
    recipe_name: 'Pasta Carbonara',
    recipe_description: 'A simple pasta dish',
    prep_time_minutes: 15,
    cook_time_minutes: 90,
    total_time_minutes: 105,
    date_added: null,
    image_url: null,
    ingredients: [],
    instructions: [],
    user_id: 2,
  };

  beforeEach(() => jest.clearAllMocks());

  it('reads native minute columns and exposes the 15-minute prep, 90-minute cook, and total', async () => {
    prisma.$queryRaw.mockResolvedValue([recipe]);
    const repository = new RecipesRepository(prisma as never);

    await expect(repository.list({})).resolves.toEqual([recipe]);
    const query = prisma.$queryRaw.mock.calls[0][0];
    expect(sqlSource(query)).toContain('r.prep_time_minutes');
    expect(sqlSource(query)).toContain('r.cook_time_minutes');
    expect(sqlSource(query)).toContain('total_time_minutes');
    expect(sqlSource(query)).not.toContain('EXTRACT(EPOCH FROM r.prep_time)');
    expect(recipe.prep_time_minutes + recipe.cook_time_minutes).toBe(105);
  });

  it('casts and normalizes rating aggregates so list JSON serialization stays safe', async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        ...recipe,
        overall_score: 4.5,
        num_ratings: BigInt(2),
      },
    ]);
    const repository = new RecipesRepository(prisma as never);

    const result = await repository.list({ q: 'pasta', sort: 'rating', page: 2, limit: 5 });
    const query = prisma.$queryRaw.mock.calls[0][0];

    expect(sqlSource(query)).toContain('COUNT(rt.rating_id), 0)::int');
    expect(sqlSource(query)).toContain('ROUND(AVG(rt.score), 1), 0)::float8');
    expect(result[0]).toMatchObject({ overall_score: 4.5, num_ratings: 2 });
    expect(() => JSON.stringify(result)).not.toThrow();
    expect(recipeOrderBySql('rating')).toBe(
      'overall_score DESC, num_ratings DESC, r.recipe_id ASC',
    );
  });

  it('supports q/search aliases, deterministic sorting, and bounded pagination', async () => {
    prisma.$queryRaw.mockResolvedValue([recipe]);
    const repository = new RecipesRepository(prisma as never);

    await repository.list({ search: ' soup ', sort: 'name', page: 3, limit: 500 });
    const query = prisma.$queryRaw.mock.calls[0][0];

    expect(query.values).toEqual(expect.arrayContaining(['%soup%', 100, 200]));
    expect(recipeOrderBySql('name')).toBe(
      'LOWER(r.recipe_name) ASC, r.recipe_name ASC, r.recipe_id ASC',
    );
  });

  it('normalizes aggregate values on recipe detail responses as well', async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        ...recipe,
        overall_score: 5n,
        num_ratings: 1n,
      },
    ]);
    const repository = new RecipesRepository(prisma as never);

    const result = await repository.findById(15);

    expect(result).toMatchObject({ overall_score: 5, num_ratings: 1 });
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it('uses native minute columns in the user projection', async () => {
    prisma.$queryRaw.mockResolvedValue([recipe]);
    const repository = new RecipesRepository(prisma as never);

    await repository.findByUserId(2);
    const query = prisma.$queryRaw.mock.calls[0][0];
    expect(sqlSource(query)).toContain('r.prep_time_minutes');
    expect(sqlSource(query)).toContain('r.cook_time_minutes');
    expect(sqlSource(query)).not.toMatch(/r\.prep_time\b/);
    expect(sqlSource(query)).not.toMatch(/r\.cook_time\b/);
  });

  it('dual-writes native minutes and legacy intervals on create', async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([{ recipe_id: 15 }])
      .mockResolvedValueOnce([recipe]);
    const repository = new RecipesRepository(prisma as never);

    await repository.create(2, {
      name: 'Pasta Carbonara',
      mealId: 1,
      categoryId: 3,
      prepTimeMinutes: 15,
      cookTimeMinutes: 90,
      ingredients: [],
      instructions: [],
    });

    const query = prisma.$queryRaw.mock.calls[0][0];
    const source = sqlSource(query);
    expect(source).toContain('prep_time_minutes');
    expect(source).toContain('cook_time_minutes');
    expect(source).toContain('prep_time');
    expect(source).toContain('cook_time');
    expect(source).toContain('make_interval');
    expect(query.values).toEqual(expect.arrayContaining([15, 90]));
  });

  it('dual-writes only supplied native minutes and matching legacy intervals on update', async () => {
    prisma.$executeRaw.mockResolvedValue(1);
    prisma.$queryRaw.mockResolvedValue([recipe]);
    const repository = new RecipesRepository(prisma as never);

    await repository.update(15, { prepTimeMinutes: 15, cookTimeMinutes: 90 });

    const query = prisma.$executeRaw.mock.calls[0][0];
    const source = sqlSource(query);
    expect(source).toContain('prep_time_minutes = COALESCE');
    expect(source).toContain('cook_time_minutes = COALESCE');
    expect(source).toContain('prep_time = CASE');
    expect(source).toContain('cook_time = CASE');
    expect(source).toContain('make_interval');
    expect(query.values).toEqual(expect.arrayContaining([15, 90]));
  });
});
