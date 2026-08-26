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

  const mockList = (rows: unknown[], total = rows.length) => {
    prisma.$queryRaw
      .mockResolvedValueOnce([{ total }])
      .mockResolvedValueOnce(rows);
  };

  it('reads native minute columns and exposes the 15-minute prep, 90-minute cook, and total', async () => {
    mockList([recipe]);
    const repository = new RecipesRepository(prisma as never);

    await expect(repository.list({})).resolves.toEqual({
      recipes: [recipe],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false },
    });
    const query = prisma.$queryRaw.mock.calls[1][0];
    expect(sqlSource(query)).toContain('r.prep_time_minutes');
    expect(sqlSource(query)).toContain('r.cook_time_minutes');
    expect(sqlSource(query)).toContain('total_time_minutes');
    expect(sqlSource(query)).not.toContain('EXTRACT(EPOCH FROM r.prep_time)');
    expect(recipe.prep_time_minutes + recipe.cook_time_minutes).toBe(105);
  });

  it('casts and normalizes rating aggregates so list JSON serialization stays safe', async () => {
    mockList([
      {
        ...recipe,
        overall_score: 4.5,
        num_ratings: BigInt(2),
      },
    ], 2);
    const repository = new RecipesRepository(prisma as never);

    const result = await repository.list({ q: 'pasta', sort: 'rating', page: 2, limit: 5 });
    const query = prisma.$queryRaw.mock.calls[1][0];

    expect(sqlSource(query)).toContain('COUNT(rt.rating_id), 0)::int');
    expect(sqlSource(query)).toContain('ROUND(AVG(rt.score), 1), 0)::float8');
    expect(result.recipes[0]).toMatchObject({ overall_score: 4.5, num_ratings: 2 });
    expect(result.pagination).toEqual({ page: 1, limit: 5, total: 2, totalPages: 1, hasNext: false });
    expect(() => JSON.stringify(result)).not.toThrow();
    expect(recipeOrderBySql('rating')).toBe(
      'overall_score DESC, num_ratings DESC, r.recipe_id ASC',
    );
  });

  it('supports q/search aliases, deterministic sorting, and bounded pagination', async () => {
    mockList([recipe], 1_000);
    const repository = new RecipesRepository(prisma as never);

    await repository.list({ search: ' soup ', sort: 'name', page: 3, limit: 500 });
    const query = prisma.$queryRaw.mock.calls[1][0];

    expect(query.values).toEqual(expect.arrayContaining(['soup', '%soup%', 100, 200]));
    expect(sqlSource(query)).toContain("to_tsvector(");
    expect(sqlSource(query)).toContain("plainto_tsquery('simple'");
    expect(sqlSource(query)).toContain('similarity(');
    expect(recipeOrderBySql('name')).toBe(
      'LOWER(r.recipe_name) ASC, r.recipe_name ASC, r.recipe_id ASC',
    );
  });

  it('clamps an out-of-range page to the final page before calculating the offset', async () => {
    mockList([recipe], 21);
    const repository = new RecipesRepository(prisma as never);

    await repository.list({ page: Number.MAX_SAFE_INTEGER, limit: 100 });
    const query = prisma.$queryRaw.mock.calls[1][0];

    expect(query.values).toEqual(expect.arrayContaining([100, 0]));
  });

  it('returns the final page when a request exceeds the filtered result set', async () => {
    mockList([recipe], 21);
    const repository = new RecipesRepository(prisma as never);

    await expect(repository.list({ page: 1_000_000, limit: 20 })).resolves.toMatchObject({
      recipes: [recipe],
      pagination: { page: 2, limit: 20, total: 21, totalPages: 2, hasNext: false },
    });
    const query = prisma.$queryRaw.mock.calls[1][0];
    expect(query.values).toEqual(expect.arrayContaining([20, 20]));
  });

  it('uses page one and zero offset for an empty result set', async () => {
    mockList([], 0);
    const repository = new RecipesRepository(prisma as never);

    await expect(repository.list({ page: 1_000_000, limit: 20 })).resolves.toMatchObject({
      recipes: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false },
    });
    const query = prisma.$queryRaw.mock.calls[1][0];
    expect(query.values).toEqual(expect.arrayContaining([20, 0]));
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

  it('restricts public list queries to published recipes', async () => {
    mockList([recipe]);
    const repository = new RecipesRepository(prisma as never);

    await repository.list({});

    expect(sqlSource(prisma.$queryRaw.mock.calls[0][0])).toContain(
      "r.status = 'published'",
    );
    expect(sqlSource(prisma.$queryRaw.mock.calls[1][0])).toContain(
      "r.status = 'published'",
    );
  });

  it('restricts public detail queries to published recipes', async () => {
    prisma.$queryRaw.mockResolvedValue([]);
    const repository = new RecipesRepository(prisma as never);

    await repository.findById(15);

    expect(sqlSource(prisma.$queryRaw.mock.calls[0][0])).toContain(
      "r.status = 'published'",
    );
  });

  it('includes structured metadata in owner projections', async () => {
    prisma.$queryRaw.mockResolvedValue([recipe]);
    const repository = new RecipesRepository(prisma as never);

    await (repository.findByUserId as unknown as (
      userId: number,
      status: string,
    ) => Promise<unknown>)(2, 'all');

    const query = prisma.$queryRaw.mock.calls[0][0];
    expect(sqlSource(query)).toContain('recipe_ingredients');
    expect(sqlSource(query)).toContain("'recipe_ingredient_id', ri.ingredient_id");
    expect(sqlSource(query)).not.toContain('ri.recipe_ingredient_id');
    expect(sqlSource(query)).toContain('recipe_nutrition');
    expect(sqlSource(query)).toContain('recipe_dietary_tags');
    expect(sqlSource(query)).toContain('recipe_allergens');
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
    expect(source).toContain('prep_time_minutes =');
    expect(source).toContain('cook_time_minutes =');
    expect(source).toContain('prep_time = make_interval');
    expect(source).toContain('cook_time = make_interval');
    expect(source).not.toContain('COALESCE');
    expect(source).not.toContain('IS NULL');
    expect(source).toContain('make_interval');
    expect(query.values).toEqual(expect.arrayContaining([15, 90]));
  });

  it('updates a partial recipe without binding untyped null parameters', async () => {
    prisma.$executeRaw.mockResolvedValue(1);
    prisma.$queryRaw.mockResolvedValue([{ ...recipe, recipe_description: 'Updated' }]);
    const repository = new RecipesRepository(prisma as never);

    await expect(repository.update(15, { description: 'Updated' })).resolves.toMatchObject({
      recipe_description: 'Updated',
    });

    const query = prisma.$executeRaw.mock.calls[0][0];
    expect(query.values).toEqual(['Updated', 15]);
    expect(query.strings.join(' ')).toContain('recipe_description =');
    expect(query.strings.join(' ')).not.toContain('IS NULL');
  });
});
