import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the Prisma demo seed');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const DEMO_PASSWORD = 'DemoPass123!';

const demoUsers = [
  {
    fullName: 'Linh Nguyen',
    email: 'demo.chef@foodrecipes.local',
    phone: '+84901234567',
    address: '12 Nguyen Hue, Ho Chi Minh City',
  },
  {
    fullName: 'Minh Tran',
    email: 'demo.homecook@foodrecipes.local',
    phone: '+84907654321',
    address: '48 Le Loi, Ho Chi Minh City',
  },
  {
    fullName: 'An Pham',
    email: 'demo.foodie@foodrecipes.local',
    phone: null,
    address: 'Da Nang, Vietnam',
  },
] as const;

const demoCategories = [
  { name: 'Breakfast' },
  { name: 'Main Course' },
  { name: 'Dessert' },
] as const;

const demoMeals = [
  { name: 'Breakfast', description: 'Easy recipes for a bright start to the day.' },
  { name: 'Lunch & Dinner', description: 'Comforting meals for the main part of the day.' },
  { name: 'Snack', description: 'Small, simple dishes between meals.' },
] as const;

const demoRecipes = [
  {
    name: 'Classic Vietnamese Pho',
    description: 'A fragrant beef noodle soup with star anise, herbs, and lime.',
    authorEmail: 'demo.chef@foodrecipes.local',
    categoryName: 'Main Course',
    mealName: 'Lunch & Dinner',
    prepTimeMinutes: 30,
    cookTimeMinutes: 180,
    imageUrl:
      'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=1200&q=80',
    ingredients: [
      '500 g beef bones',
      '250 g rice noodles',
      '1 yellow onion',
      '2.5 L water',
      'Star anise, cinnamon, ginger, herbs, and lime',
    ],
    instructions: [
      'Char the onion and ginger until fragrant.',
      'Simmer the bones with spices for at least 3 hours, then strain the broth.',
      'Cook the noodles, assemble the bowls, and pour over the hot broth.',
      'Finish with herbs, lime, and sliced beef.',
    ],
    dateAdded: new Date('2026-08-18T08:00:00.000Z'),
  },
  {
    name: 'Avocado Toast with Chili',
    description: 'Creamy avocado on toasted sourdough with a bright chili finish.',
    authorEmail: 'demo.homecook@foodrecipes.local',
    categoryName: 'Breakfast',
    mealName: 'Breakfast',
    prepTimeMinutes: 10,
    cookTimeMinutes: 5,
    imageUrl:
      'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=1200&q=80',
    ingredients: [
      '2 slices sourdough bread',
      '1 ripe avocado',
      '1 teaspoon lemon juice',
      'Chili flakes, salt, and black pepper',
    ],
    instructions: [
      'Toast the sourdough until golden.',
      'Mash the avocado with lemon juice, salt, and pepper.',
      'Spread over the toast and finish with chili flakes.',
    ],
    dateAdded: new Date('2026-08-19T08:00:00.000Z'),
  },
  {
    name: 'Mango Coconut Chia Pudding',
    description: 'A make-ahead tropical pudding layered with mango and coconut.',
    authorEmail: 'demo.chef@foodrecipes.local',
    categoryName: 'Dessert',
    mealName: 'Snack',
    prepTimeMinutes: 15,
    cookTimeMinutes: 5,
    imageUrl:
      'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80',
    ingredients: [
      '400 ml coconut milk',
      '60 g chia seeds',
      '1 ripe mango',
      '1 tablespoon maple syrup',
      'Toasted coconut flakes',
    ],
    instructions: [
      'Whisk coconut milk, chia seeds, and maple syrup together.',
      'Chill for at least 4 hours until thickened.',
      'Layer with diced mango and toasted coconut before serving.',
    ],
    dateAdded: new Date('2026-08-20T08:00:00.000Z'),
  },
] as const;

const demoWishlists = [
  { userEmail: 'demo.homecook@foodrecipes.local', recipeName: 'Classic Vietnamese Pho' },
  { userEmail: 'demo.foodie@foodrecipes.local', recipeName: 'Classic Vietnamese Pho' },
  { userEmail: 'demo.chef@foodrecipes.local', recipeName: 'Avocado Toast with Chili' },
  { userEmail: 'demo.foodie@foodrecipes.local', recipeName: 'Mango Coconut Chia Pudding' },
] as const;

const demoRatings = [
  {
    userEmail: 'demo.homecook@foodrecipes.local',
    recipeName: 'Classic Vietnamese Pho',
    score: 5,
    review: 'The broth is rich and deeply aromatic. A weekend favorite.',
  },
  {
    userEmail: 'demo.foodie@foodrecipes.local',
    recipeName: 'Classic Vietnamese Pho',
    score: 4,
    review: 'Excellent flavor and the fresh herbs make the bowl feel light.',
  },
  {
    userEmail: 'demo.foodie@foodrecipes.local',
    recipeName: 'Avocado Toast with Chili',
    score: 5,
    review: 'Fast, bright, and exactly what I want for breakfast.',
  },
  {
    userEmail: 'demo.chef@foodrecipes.local',
    recipeName: 'Avocado Toast with Chili',
    score: 4,
    review: 'Simple ingredients, with just enough heat from the chili.',
  },
] as const;

type SeedRecipeRow = { recipe_id: number };

const findOrCreateCategory = async (
  client: Prisma.TransactionClient,
  name: string,
) => {
  const existing = await client.category.findFirst({ where: { name } });
  return existing ?? client.category.create({ data: { name } });
};

const findOrCreateMeal = async (
  client: Prisma.TransactionClient,
  meal: (typeof demoMeals)[number],
) => {
  const existing = await client.meal.findFirst({ where: { name: meal.name } });
  return (
    existing ??
    client.meal.create({
      data: { name: meal.name, description: meal.description },
    })
  );
};

const insertRecipe = async (
  client: Prisma.TransactionClient,
  recipe: (typeof demoRecipes)[number],
  userId: number,
  categoryId: number,
  mealId: number,
): Promise<number> => {
  const rows = await client.$queryRaw<SeedRecipeRow[]>(Prisma.sql`
    INSERT INTO "recipes" (
      "recipe_name",
      "recipe_description",
      "meal_id",
      "category_id",
      "prep_time_minutes",
      "cook_time_minutes",
      "prep_time",
      "cook_time",
      "date_added",
      "user_id",
      "image_url",
      "ingredients",
      "instructions"
    ) VALUES (
      ${recipe.name},
      ${recipe.description},
      ${mealId},
      ${categoryId},
      ${recipe.prepTimeMinutes},
      ${recipe.cookTimeMinutes},
      make_interval(mins => ${recipe.prepTimeMinutes}),
      make_interval(mins => ${recipe.cookTimeMinutes}),
      ${recipe.dateAdded},
      ${userId},
      ${recipe.imageUrl},
      ${recipe.ingredients},
      ${recipe.instructions}
    )
    RETURNING "recipe_id"
  `);

  const recipeId = rows[0]?.recipe_id;
  if (!recipeId) {
    throw new Error(`Recipe was not inserted: ${recipe.name}`);
  }

  return Number(recipeId);
};

const seed = async (): Promise<void> => {
  const passwordHash = await hash(DEMO_PASSWORD, 10);
  const summary = await prisma.$transaction(async (client) => {
    const existingRecipes = await client.recipe.findMany({
      where: { name: { in: demoRecipes.map((recipe) => recipe.name) } },
      select: { id: true },
    });
    const existingRecipeIds = existingRecipes.map((recipe) => recipe.id);

    if (existingRecipeIds.length) {
      await client.rating.deleteMany({
        where: { recipeId: { in: existingRecipeIds } },
      });
      await client.wishlist.deleteMany({
        where: { recipeId: { in: existingRecipeIds } },
      });
      await client.recipe.deleteMany({
        where: { id: { in: existingRecipeIds } },
      });
    }

    const users = new Map<string, number>();
    for (const user of demoUsers) {
      const row = await client.user.upsert({
        where: { email: user.email },
        update: {
          fullName: user.fullName,
          password: passwordHash,
          phone: user.phone,
          address: user.address,
        },
        create: {
          fullName: user.fullName,
          email: user.email,
          password: passwordHash,
          createdOn: new Date('2026-08-15T08:00:00.000Z'),
          lastLogin: new Date('2026-08-23T08:00:00.000Z'),
          phone: user.phone,
          address: user.address,
        },
      });
      users.set(user.email, row.id);
    }

    const categories = new Map<string, number>();
    for (const category of demoCategories) {
      const row = await findOrCreateCategory(client, category.name);
      categories.set(category.name, row.id);
    }

    const meals = new Map<string, number>();
    for (const meal of demoMeals) {
      const row = await findOrCreateMeal(client, meal);
      meals.set(meal.name, row.id);
    }

    const recipes = new Map<string, number>();
    for (const recipe of demoRecipes) {
      const userId = users.get(recipe.authorEmail);
      const categoryId = categories.get(recipe.categoryName);
      const mealId = meals.get(recipe.mealName);

      if (!userId || !categoryId || !mealId) {
        throw new Error(`Missing parent row for recipe: ${recipe.name}`);
      }

      const recipeId = await insertRecipe(client, recipe, userId, categoryId, mealId);
      recipes.set(recipe.name, recipeId);
    }

    for (const [index, wishlist] of demoWishlists.entries()) {
      const userId = users.get(wishlist.userEmail);
      const recipeId = recipes.get(wishlist.recipeName);
      if (!userId || !recipeId) throw new Error(`Missing wishlist parent for ${wishlist.recipeName}`);

      await client.wishlist.create({
        data: {
          userId,
          recipeId,
          dateAdded: new Date(`2026-08-${21 + index}T08:00:00.000Z`),
        },
      });
    }

    for (const [index, rating] of demoRatings.entries()) {
      const userId = users.get(rating.userEmail);
      const recipeId = recipes.get(rating.recipeName);
      if (!userId || !recipeId) throw new Error(`Missing rating parent for ${rating.recipeName}`);

      await client.rating.create({
        data: {
          userId,
          recipeId,
          score: new Prisma.Decimal(rating.score),
          review: rating.review,
          dateAdded: new Date(`2026-08-${21 + index}T10:00:00.000Z`),
        },
      });
    }

    return {
      users: users.size,
      categories: categories.size,
      meals: meals.size,
      recipes: recipes.size,
      wishlists: demoWishlists.length,
      ratings: demoRatings.length,
    };
  });

  console.log(
    `Seeded demo graph: ${summary.users} users, ${summary.categories} categories, `
      + `${summary.meals} meals, ${summary.recipes} recipes, `
      + `${summary.wishlists} wishlist rows, ${summary.ratings} rating rows.`,
  );
  console.log(`Demo accounts: ${demoUsers.map((user) => user.email).join(', ')}`);
};

seed()
  .catch((error: unknown) => {
    console.error('Prisma demo seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
