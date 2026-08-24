import { RecipeMetadataRepository } from './recipe-metadata.repository';

const sqlSource = (query: { strings: readonly string[] }) => query.strings.join(' ');

describe('RecipeMetadataRepository', () => {
  const prisma = {
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('reads nutrition and allergens from explicit metadata tables', async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([{ recipe_id: 15, calories_per_serving: 420, protein_grams: null, carbohydrates_grams: null, fat_grams: null, fiber_grams: null, sugar_grams: null, sodium_milligrams: null, source: 'provided_by_author', source_reference: null, updated_at: new Date() }])
      .mockResolvedValueOnce([{ recipe_id: 15, allergen_id: 2, name: 'peanuts', source: 'provided_by_author', source_reference: null, updated_at: new Date() }]);
    const repository = new RecipeMetadataRepository(prisma as never);

    await expect(repository.findByRecipeId(15)).resolves.toMatchObject({
      nutrition: { calories_per_serving: 420, source: 'provided_by_author' },
      allergens: [{ name: 'peanuts' }],
    });
    expect(sqlSource(prisma.$queryRaw.mock.calls[0][0])).toContain('recipe_nutrition');
    expect(sqlSource(prisma.$queryRaw.mock.calls[1][0])).toContain('recipe_allergens');
  });

  it('uses a transaction when replacing metadata', async () => {
    const transaction = {
      $executeRaw: jest.fn().mockResolvedValue(1),
    };
    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<void>) => callback(transaction));
    prisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const repository = new RecipeMetadataRepository(prisma as never);

    await repository.replace(15, null, []);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.$executeRaw).toHaveBeenCalledTimes(2);
  });
});
