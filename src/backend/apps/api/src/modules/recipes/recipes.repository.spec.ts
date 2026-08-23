import { RecipesRepository } from './recipes.repository';

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
