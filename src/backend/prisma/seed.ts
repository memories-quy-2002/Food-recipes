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
  },
  {
    name: 'Lemongrass Chicken Rice',
    description: 'Caramelized lemongrass chicken served over steamed jasmine rice.',
    authorEmail: 'demo.foodie@foodrecipes.local',
    categoryName: 'Main Course',
    mealName: 'Lunch & Dinner',
    prepTimeMinutes: 20,
    cookTimeMinutes: 25,
    imageUrl:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['500 g chicken thighs', '2 stalks lemongrass', '2 tablespoons fish sauce', 'Jasmine rice, garlic, and scallions'],
    instructions: ['Pound the lemongrass and mix it with garlic, fish sauce, and sugar.', 'Marinate the chicken for 20 minutes.', 'Sear until golden and cooked through, then serve with rice and scallions.'],
  },
  {
    name: 'Banana Oat Pancakes',
    description: 'Fluffy blender pancakes sweetened naturally with ripe banana.',
    authorEmail: 'demo.chef@foodrecipes.local',
    categoryName: 'Breakfast',
    mealName: 'Breakfast',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    imageUrl:
      'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['1 ripe banana', '100 g rolled oats', '1 egg', 'Milk, cinnamon, and baking powder'],
    instructions: ['Blend the banana, oats, egg, milk, cinnamon, and baking powder.', 'Rest the batter for 5 minutes.', 'Cook small pancakes on a lightly greased skillet and serve warm.'],
  },
  {
    name: 'Berry Yogurt Parfait',
    description: 'Creamy yogurt layered with berries, granola, and a little honey.',
    authorEmail: 'demo.homecook@foodrecipes.local',
    categoryName: 'Dessert',
    mealName: 'Breakfast',
    prepTimeMinutes: 10,
    cookTimeMinutes: 5,
    imageUrl:
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['400 g Greek yogurt', '150 g mixed berries', '80 g granola', '1 tablespoon honey'],
    instructions: ['Spoon yogurt into two glasses.', 'Layer with berries and granola.', 'Drizzle with honey and serve chilled.'],
  },
  {
    name: 'Garlic Butter Shrimp Pasta',
    description: 'Silky pasta tossed with shrimp, garlic, lemon, and parsley.',
    authorEmail: 'demo.chef@foodrecipes.local',
    categoryName: 'Main Course',
    mealName: 'Lunch & Dinner',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    imageUrl:
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['250 g spaghetti', '300 g peeled shrimp', '4 garlic cloves', 'Butter, lemon, parsley, and parmesan'],
    instructions: ['Boil the pasta until al dente and reserve some pasta water.', 'Sauté garlic and shrimp in butter until pink.', 'Toss with pasta, lemon, parsley, parmesan, and enough pasta water to coat.'],
  },
  {
    name: 'Greek Chickpea Salad',
    description: 'A crisp chickpea salad with cucumber, tomato, olives, and feta.',
    authorEmail: 'demo.foodie@foodrecipes.local',
    categoryName: 'Main Course',
    mealName: 'Lunch & Dinner',
    prepTimeMinutes: 15,
    cookTimeMinutes: 5,
    imageUrl:
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['1 can chickpeas', '1 cucumber', '2 tomatoes', 'Olives, feta, red onion, and oregano'],
    instructions: ['Rinse and drain the chickpeas.', 'Chop the vegetables and crumble the feta.', 'Toss everything with olive oil, lemon juice, oregano, salt, and pepper.'],
  },
  {
    name: 'Tofu Banh Mi',
    description: 'Crisp tofu, pickled vegetables, herbs, and chili inside a crusty baguette.',
    authorEmail: 'demo.homecook@foodrecipes.local',
    categoryName: 'Main Course',
    mealName: 'Lunch & Dinner',
    prepTimeMinutes: 25,
    cookTimeMinutes: 15,
    imageUrl:
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['2 baguettes', '300 g firm tofu', 'Carrot and daikon', 'Cucumber, cilantro, soy sauce, and chili mayo'],
    instructions: ['Quick-pickle carrot and daikon with rice vinegar and sugar.', 'Pan-fry tofu until crisp and glaze with soy sauce.', 'Fill baguettes with tofu, pickles, cucumber, cilantro, and chili mayo.'],
  },
  {
    name: 'Tomato Basil Bruschetta',
    description: 'Toasted bread topped with juicy tomatoes, basil, garlic, and olive oil.',
    authorEmail: 'demo.foodie@foodrecipes.local',
    categoryName: 'Breakfast',
    mealName: 'Snack',
    prepTimeMinutes: 15,
    cookTimeMinutes: 8,
    imageUrl:
      'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['1 baguette', '3 ripe tomatoes', 'Fresh basil', 'Garlic, olive oil, and balsamic vinegar'],
    instructions: ['Dice tomatoes and mix with basil, olive oil, salt, and balsamic vinegar.', 'Toast baguette slices and rub them with garlic.', 'Spoon the tomato mixture over the toast just before serving.'],
  },
  {
    name: 'Coconut Curry Lentils',
    description: 'Creamy red lentils simmered with coconut milk, tomato, and warm spices.',
    authorEmail: 'demo.chef@foodrecipes.local',
    categoryName: 'Main Course',
    mealName: 'Lunch & Dinner',
    prepTimeMinutes: 10,
    cookTimeMinutes: 35,
    imageUrl:
      'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['250 g red lentils', '400 ml coconut milk', '1 can diced tomatoes', 'Onion, garlic, curry powder, and spinach'],
    instructions: ['Sauté onion and garlic with curry powder.', 'Add lentils, tomatoes, coconut milk, and water.', 'Simmer until tender, fold in spinach, and serve with rice.'],
  },
  {
    name: 'Lemon Herb Roasted Salmon',
    description: 'Tender salmon roasted with lemon, dill, garlic, and seasonal vegetables.',
    authorEmail: 'demo.homecook@foodrecipes.local',
    categoryName: 'Main Course',
    mealName: 'Lunch & Dinner',
    prepTimeMinutes: 10,
    cookTimeMinutes: 18,
    imageUrl:
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['2 salmon fillets', '1 lemon', 'Fresh dill', 'Garlic, olive oil, asparagus, and baby potatoes'],
    instructions: ['Place salmon and vegetables on a lined tray.', 'Season with garlic, lemon, dill, olive oil, salt, and pepper.', 'Roast until the salmon flakes easily and the vegetables are tender.'],
  },
  {
    name: 'Chicken Caesar Wrap',
    description: 'A portable wrap with grilled chicken, crunchy romaine, parmesan, and Caesar dressing.',
    authorEmail: 'demo.foodie@foodrecipes.local',
    categoryName: 'Main Course',
    mealName: 'Lunch & Dinner',
    prepTimeMinutes: 15,
    cookTimeMinutes: 18,
    imageUrl:
      'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['2 chicken breasts', '2 large tortillas', 'Romaine lettuce', 'Parmesan, Caesar dressing, and black pepper'],
    instructions: ['Season and grill the chicken until cooked through.', 'Slice the chicken and toss it with romaine, parmesan, and dressing.', 'Roll tightly in tortillas and slice in half.'],
  },
  {
    name: 'Roasted Pumpkin Soup',
    description: 'Velvety pumpkin soup with ginger, coconut milk, and toasted seeds.',
    authorEmail: 'demo.chef@foodrecipes.local',
    categoryName: 'Main Course',
    mealName: 'Lunch & Dinner',
    prepTimeMinutes: 15,
    cookTimeMinutes: 45,
    imageUrl:
      'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['800 g pumpkin', '1 onion', '500 ml vegetable stock', 'Ginger, coconut milk, and pumpkin seeds'],
    instructions: ['Roast pumpkin and onion until caramelized.', 'Blend with stock, ginger, and coconut milk.', 'Simmer for 10 minutes, season, and garnish with toasted seeds.'],
  },
  {
    name: 'Spicy Tuna Rice Bowl',
    description: 'A quick rice bowl with spicy tuna, cucumber, avocado, and sesame.',
    authorEmail: 'demo.homecook@foodrecipes.local',
    categoryName: 'Main Course',
    mealName: 'Lunch & Dinner',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    imageUrl:
      'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['2 cans tuna', '2 bowls cooked rice', '1 avocado', 'Cucumber, mayonnaise, sriracha, soy sauce, and sesame'],
    instructions: ['Mix tuna with mayonnaise, sriracha, and soy sauce.', 'Arrange rice, cucumber, and avocado in bowls.', 'Top with spicy tuna, sesame, and sliced scallions.'],
  },
  {
    name: 'Vietnamese Fresh Spring Rolls',
    description: 'Rice paper rolls packed with shrimp, vermicelli, herbs, and crunchy vegetables.',
    authorEmail: 'demo.foodie@foodrecipes.local',
    categoryName: 'Main Course',
    mealName: 'Snack',
    prepTimeMinutes: 30,
    cookTimeMinutes: 8,
    imageUrl:
      'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['Rice paper wrappers', '200 g shrimp', 'Rice vermicelli', 'Lettuce, mint, cucumber, and peanut dipping sauce'],
    instructions: ['Cook the shrimp and vermicelli, then cool them.', 'Soften rice paper and layer lettuce, herbs, noodles, vegetables, and shrimp.', 'Roll tightly and serve with peanut dipping sauce.'],
  },
  {
    name: 'Chocolate Banana Smoothie Bowl',
    description: 'A thick cocoa smoothie bowl finished with banana, nuts, and cacao nibs.',
    authorEmail: 'demo.homecook@foodrecipes.local',
    categoryName: 'Dessert',
    mealName: 'Breakfast',
    prepTimeMinutes: 10,
    cookTimeMinutes: 5,
    imageUrl:
      'https://images.unsplash.com/photo-1514995669114-6081e934b693?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['2 frozen bananas', '2 tablespoons cocoa powder', '100 ml milk', 'Peanut butter, almonds, and cacao nibs'],
    instructions: ['Blend frozen bananas, cocoa, milk, and peanut butter until thick.', 'Pour into a bowl.', 'Top with sliced banana, almonds, and cacao nibs.'],
  },
  {
    name: 'Apple Cinnamon Crumble',
    description: 'Warm cinnamon apples under a golden oat and brown sugar topping.',
    authorEmail: 'demo.chef@foodrecipes.local',
    categoryName: 'Dessert',
    mealName: 'Snack',
    prepTimeMinutes: 15,
    cookTimeMinutes: 35,
    imageUrl:
      'https://images.unsplash.com/photo-1535920527002-b35e96722eb9?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['5 apples', '100 g rolled oats', '80 g flour', 'Brown sugar, cinnamon, butter, and lemon juice'],
    instructions: ['Toss sliced apples with lemon juice, cinnamon, and sugar.', 'Rub oats, flour, brown sugar, and butter into crumbs.', 'Bake over the apples until bubbling and golden.'],
  },
  {
    name: 'Strawberry Shortcake Cups',
    description: 'Individual dessert cups with macerated strawberries, sponge, and whipped cream.',
    authorEmail: 'demo.foodie@foodrecipes.local',
    categoryName: 'Dessert',
    mealName: 'Snack',
    prepTimeMinutes: 20,
    cookTimeMinutes: 5,
    imageUrl:
      'https://images.unsplash.com/photo-1464195244916-405fa0a82545?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['400 g strawberries', '200 g sponge cake', '250 ml whipping cream', 'Sugar and vanilla extract'],
    instructions: ['Slice strawberries and macerate them with a little sugar.', 'Whip cream with vanilla until soft peaks form.', 'Layer cake, strawberries, and cream in small cups.'],
  },
  {
    name: 'Sesame Peanut Noodles',
    description: 'Chewy noodles coated in a savory sesame-peanut sauce with crisp vegetables.',
    authorEmail: 'demo.chef@foodrecipes.local',
    categoryName: 'Main Course',
    mealName: 'Lunch & Dinner',
    prepTimeMinutes: 15,
    cookTimeMinutes: 12,
    imageUrl:
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['250 g wheat noodles', '3 tablespoons peanut butter', 'Soy sauce, sesame oil, and rice vinegar', 'Carrot, cucumber, and scallions'],
    instructions: ['Cook the noodles and rinse them under cold water.', 'Whisk peanut butter, soy sauce, sesame oil, and vinegar into a sauce.', 'Toss noodles with sauce and vegetables, then garnish with sesame.'],
  },
  {
    name: 'Caprese Pasta Salad',
    description: 'Chilled pasta salad with cherry tomatoes, mozzarella, basil, and pesto.',
    authorEmail: 'demo.homecook@foodrecipes.local',
    categoryName: 'Main Course',
    mealName: 'Lunch & Dinner',
    prepTimeMinutes: 10,
    cookTimeMinutes: 12,
    imageUrl:
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['250 g short pasta', '200 g cherry tomatoes', '150 g mozzarella pearls', 'Basil, pesto, olive oil, and balsamic glaze'],
    instructions: ['Boil pasta until al dente, drain, and cool.', 'Toss with tomatoes, mozzarella, basil, and pesto.', 'Finish with olive oil, pepper, and balsamic glaze.'],
  },
  {
    name: 'Crispy Potato Tacos',
    description: 'Golden potato tacos with cabbage slaw, lime, and smoky chipotle sauce.',
    authorEmail: 'demo.foodie@foodrecipes.local',
    categoryName: 'Main Course',
    mealName: 'Snack',
    prepTimeMinutes: 20,
    cookTimeMinutes: 30,
    imageUrl:
      'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['500 g potatoes', '8 corn tortillas', 'Cabbage, lime, and cilantro', 'Chipotle sauce, cumin, and cotija cheese'],
    instructions: ['Boil and mash potatoes with cumin, salt, and pepper.', 'Fill tortillas with potato and fold them closed.', 'Pan-fry until crisp, then serve with slaw, lime, sauce, and cheese.'],
  },
  {
    name: 'Honey Soy Glazed Tofu',
    description: 'Crispy tofu coated in a glossy honey-soy glaze with broccoli and rice.',
    authorEmail: 'demo.chef@foodrecipes.local',
    categoryName: 'Main Course',
    mealName: 'Lunch & Dinner',
    prepTimeMinutes: 15,
    cookTimeMinutes: 25,
    imageUrl:
      'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['400 g firm tofu', '2 tablespoons soy sauce', '1 tablespoon honey', 'Broccoli, ginger, garlic, sesame, and rice'],
    instructions: ['Press and cube the tofu, then pan-fry until crisp.', 'Simmer soy sauce, honey, ginger, and garlic into a glaze.', 'Toss tofu in the glaze and serve with steamed broccoli and rice.'],
  },
  {
    name: 'Blueberry Lemon Muffins',
    description: 'Tender lemon muffins bursting with blueberries and finished with lemon zest.',
    authorEmail: 'demo.homecook@foodrecipes.local',
    categoryName: 'Dessert',
    mealName: 'Breakfast',
    prepTimeMinutes: 15,
    cookTimeMinutes: 22,
    imageUrl:
      'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['200 g flour', '150 g blueberries', '1 lemon', 'Milk, egg, butter, and sugar'],
    instructions: ['Whisk flour, sugar, and lemon zest in a bowl.', 'Fold in the wet ingredients and blueberries without overmixing.', 'Bake in a muffin tin until risen and lightly golden.'],
  },
  {
    name: 'Dark Chocolate Energy Bites',
    description: 'No-bake oat and date bites with dark chocolate, peanut butter, and coconut.',
    authorEmail: 'demo.foodie@foodrecipes.local',
    categoryName: 'Dessert',
    mealName: 'Snack',
    prepTimeMinutes: 20,
    cookTimeMinutes: 5,
    imageUrl:
      'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=1200&q=80',
    ingredients: ['150 g dates', '100 g rolled oats', '2 tablespoons peanut butter', 'Dark chocolate, cocoa, and coconut'],
    instructions: ['Blend dates, oats, peanut butter, and cocoa into a sticky mixture.', 'Fold in chopped dark chocolate.', 'Roll into bites and chill until firm.'],
  },
].map((recipe, index) => ({
  ...recipe,
  dateAdded: new Date(Date.UTC(2026, 7, 1 + index, 8, 0, 0)),
}));

if (demoRecipes.length !== 25) {
  throw new Error(`Expected exactly 25 demo recipes, got ${demoRecipes.length}`);
}

const wishlistUserEmails = [
  'demo.homecook@foodrecipes.local',
  'demo.foodie@foodrecipes.local',
  'demo.chef@foodrecipes.local',
] as const;

const demoWishlists = demoRecipes.map((recipe, index) => ({
  userEmail: wishlistUserEmails[(index + 1) % wishlistUserEmails.length],
  recipeName: recipe.name,
}));

const demoRatings = demoRecipes.map((recipe, index) => ({
  userEmail: wishlistUserEmails[(index + 2) % wishlistUserEmails.length],
  recipeName: recipe.name,
  score: 4 + (index % 2),
  review: `A delicious demo recipe with a clear ${recipe.mealName.toLowerCase()} use case.`,
}));

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
          dateAdded: new Date(Date.UTC(2026, 7, 21 + index, 8, 0, 0)),
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
          dateAdded: new Date(Date.UTC(2026, 7, 21 + index, 10, 0, 0)),
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
