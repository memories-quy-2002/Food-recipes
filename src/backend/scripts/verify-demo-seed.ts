import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to verify the production demo seed');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

type CountRow = { count: number | bigint };

const firstCount = (rows: CountRow[]): number => Number(rows[0]?.count ?? 0);

const verify = async (): Promise<void> => {
  const [users, categories, meals, recipes, wishlist, ratings, pantryItems, mealPlans, mealPlanItems, activeCookingSessions, cookingHistory, linked, orphaned] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.meal.count(),
    prisma.recipe.count(),
    prisma.wishlist.count(),
    prisma.rating.count(),
    prisma.pantryItem.count(),
    prisma.mealPlan.count(),
    prisma.mealPlanItem.count(),
    prisma.cookingSession.count({ where: { status: { in: ['active', 'paused'] } } }),
    prisma.cookingHistory.count(),
    prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM recipes r
      JOIN accounts a ON a.user_id = r.user_id
      JOIN categories c ON c.category_id = r.category_id
      JOIN meals m ON m.meal_id = r.meal_id
    `),
    prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM recipes r
      LEFT JOIN accounts a ON a.user_id = r.user_id
      LEFT JOIN categories c ON c.category_id = r.category_id
      LEFT JOIN meals m ON m.meal_id = r.meal_id
      WHERE a.user_id IS NULL
         OR c.category_id IS NULL
         OR m.meal_id IS NULL
    `),
  ]);

  const summary = {
    users,
    categories,
    meals,
    recipes,
    wishlist,
    ratings,
    pantryItems,
    mealPlans,
    mealPlanItems,
    activeCookingSessions,
    cookingHistory,
    fullyLinkedRecipes: firstCount(linked),
    orphanRecipes: firstCount(orphaned),
  };

  const expected = {
    users: 4,
    categories: 5,
    meals: 4,
    recipes: 25,
    wishlist: 13,
    ratings: 40,
    pantryItems: 8,
    mealPlans: 1,
    mealPlanItems: 6,
    activeCookingSessions: 1,
    cookingHistory: 1,
    fullyLinkedRecipes: 25,
    orphanRecipes: 0,
  };

  if (JSON.stringify(summary) !== JSON.stringify(expected)) {
    throw new Error(`Demo seed verification failed: ${JSON.stringify(summary)}`);
  }

  console.log(`Demo seed verified: ${JSON.stringify(summary)}`);
};

verify()
  .catch((error: unknown) => {
    console.error('Demo seed verification failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
