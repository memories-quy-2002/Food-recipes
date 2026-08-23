import { WishlistRepository } from './wishlist.repository';

describe('WishlistRepository', () => {
  const prisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const row = {
    saved_at: new Date('2026-08-23T06:30:00.000Z'),
    recipe_id: 15,
    recipe_name: 'Pasta Carbonara',
    recipe_description: 'A simple pasta dish',
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    total_time_minutes: 30,
    date_added: new Date('2026-08-20T06:30:00.000Z'),
    image_url: null,
    user_id: 2,
    meal_id: 1,
    meal_name: 'Dinner',
    meal_description: 'Evening meals',
    category_id: 3,
    category_name: 'Pasta',
    overall_score: 4.5,
    num_ratings: 2,
  };

  beforeEach(() => jest.clearAllMocks());

  it('maps joined recipe data and saved timestamp into the API item shape', async () => {
    prisma.$queryRaw.mockResolvedValue([row]);
    const repository = new WishlistRepository(prisma as never);

    await expect(repository.listByUserId(7)).resolves.toEqual([
      {
        recipe: {
          recipe_id: 15,
          recipe_name: 'Pasta Carbonara',
          recipe_description: 'A simple pasta dish',
          prep_time_minutes: 10,
          cook_time_minutes: 20,
          total_time_minutes: 30,
          date_added: row.date_added,
          image_url: null,
          user_id: 2,
          meal_id: 1,
          meal_name: 'Dinner',
          meal_description: 'Evening meals',
          category_id: 3,
          category_name: 'Pasta',
          overall_score: 4.5,
          num_ratings: 2,
        },
        savedAt: '2026-08-23T06:30:00.000Z',
      },
    ]);
    const query = prisma.$queryRaw.mock.calls[0][0];
    const source = query.strings.join(' ');
    expect(source).toContain('r.prep_time_minutes');
    expect(source).toContain('r.cook_time_minutes');
    expect(source).toContain('total_time_minutes');
    expect(source).not.toContain('EXTRACT(EPOCH FROM r.prep_time)');
  });

  it('targets the user-recipe unique key while returning the existing row on a repeated add', async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([row]);
    const repository = new WishlistRepository(prisma as never);

    await expect(repository.add(7, 15)).resolves.toEqual({
      recipe: expect.objectContaining({ recipe_id: 15 }),
      savedAt: '2026-08-23T06:30:00.000Z',
    });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    const query = prisma.$queryRaw.mock.calls[0][0];
    const source = query.strings.join(' ');
    expect(source).toContain('ON CONFLICT (');
    expect(source).toContain('user_id');
    expect(source).toContain('recipe_id');
    expect(source).not.toContain('ON CONFLICT ON CONSTRAINT');
  });

  it('returns whether the authenticated user owned the removed wishlist row', async () => {
    prisma.$executeRaw.mockResolvedValue(1);
    const repository = new WishlistRepository(prisma as never);

    await expect(repository.remove(7, 15)).resolves.toBe(true);
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });
});
