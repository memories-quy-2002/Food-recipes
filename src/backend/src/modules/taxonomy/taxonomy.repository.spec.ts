import { TaxonomyRepository } from './taxonomy.repository';

const sqlSource = (query: { strings: readonly string[] }) =>
  query.strings.join(' ');

describe('TaxonomyRepository', () => {
  const prisma = {
    $queryRaw: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns only categories linked to recipes with the legacy response shape', async () => {
    prisma.$queryRaw.mockResolvedValue([
      { id: 2, name: 'Soups', recipe_count: 3 },
    ]);
    const repository = new TaxonomyRepository(prisma as never);

    await expect(repository.listCategories()).resolves.toEqual({
      categories: [{ id: 2, name: 'Soups', recipe_count: 3 }],
    });

    const query = prisma.$queryRaw.mock.calls[0][0];
    expect(sqlSource(query)).toMatch(
      /FROM categories c\s+JOIN recipes r ON c\.category_id = r\.category_id/,
    );
    expect(sqlSource(query)).toMatch(
      /GROUP BY c\.category_id, c\.category_name\s+ORDER BY c\.category_id ASC/,
    );
  });

  it('returns only meals linked to recipes with descriptions and counts', async () => {
    prisma.$queryRaw.mockResolvedValue([
      { id: 4, name: 'Dinner', description: null, recipe_count: 2 },
    ]);
    const repository = new TaxonomyRepository(prisma as never);

    await expect(repository.listMeals()).resolves.toEqual({
      meals: [{ id: 4, name: 'Dinner', description: null, recipe_count: 2 }],
    });

    const query = prisma.$queryRaw.mock.calls[0][0];
    expect(sqlSource(query)).toMatch(
      /FROM meals m\s+JOIN recipes r ON m\.meal_id = r\.meal_id/,
    );
    expect(sqlSource(query)).toMatch(
      /GROUP BY m\.meal_id, m\.meal_name, m\.meal_description\s+ORDER BY m\.meal_id ASC/,
    );
  });
});
