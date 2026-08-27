import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../src/generated/prisma/client';
import { hash } from 'bcryptjs';

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the Prisma demo seed');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const DEMO_PASSWORD = 'DemoPass123!';
// The demo graph contains many dependent writes; Prisma's default interactive
// transaction timeout of 5 seconds is too short for a remote production DB.
const SEED_TRANSACTION_MAX_WAIT_MS = 30_000;
const SEED_TRANSACTION_TIMEOUT_MS = 5 * 60_000;
type RecipeStatus = 'draft' | 'published' | 'archived';

const demoUsers = [
  {
    key: 'chef',
    fullName: 'Linh Nguyen',
    email: 'demo.chef@foodrecipes.local',
    phone: '+84901234567',
    address: '12 Nguyen Hue, Ho Chi Minh City',
    role: 'user',
  },
  {
    key: 'homecook',
    fullName: 'Minh Tran',
    email: 'demo.homecook@foodrecipes.local',
    phone: '+84907654321',
    address: '48 Le Loi, Ho Chi Minh City',
    role: 'user',
  },
  {
    key: 'foodie',
    fullName: 'An Pham',
    email: 'demo.foodie@foodrecipes.local',
    phone: null,
    address: 'Da Nang, Vietnam',
    role: 'user',
  },
  {
    key: 'admin',
    fullName: 'Demo Moderator',
    email: 'demo.admin@foodrecipes.local',
    phone: null,
    address: 'Food Recipes Demo Workspace',
    role: 'admin',
  },
] as const;

const demoRegularUserEmails = demoUsers
  .filter((user) => user.role === 'user')
  .map((user) => user.email);

const demoCategories = [
  { name: 'Breakfast' },
  { name: 'Main Course' },
  { name: 'Dessert' },
  { name: 'Vegetarian' },
  { name: 'Soup & Salad' },
] as const;

const demoMeals = [
  { name: 'Breakfast', description: 'Easy recipes for a bright start to the day.' },
  { name: 'Lunch & Dinner', description: 'Comforting meals for the main part of the day.' },
  { name: 'Snack', description: 'Small, simple dishes between meals.' },
  { name: 'Dinner', description: 'Relaxed recipes for a satisfying evening meal.' },
] as const;

const categoryOverrides: Record<string, string> = {
  'Greek Chickpea Salad': 'Vegetarian',
  'Tofu Banh Mi': 'Vegetarian',
  'Coconut Curry Lentils': 'Vegetarian',
  'Roasted Pumpkin Soup': 'Soup & Salad',
  'Caprese Pasta Salad': 'Soup & Salad',
};

const mealOverrides: Record<string, string> = {
  'Lemongrass Chicken Rice': 'Dinner',
  'Garlic Butter Shrimp Pasta': 'Dinner',
  'Lemon Herb Roasted Salmon': 'Dinner',
  'Chicken Caesar Wrap': 'Dinner',
  'Spicy Tuna Rice Bowl': 'Dinner',
  'Sesame Peanut Noodles': 'Dinner',
  'Caprese Pasta Salad': 'Dinner',
  'Honey Soy Glazed Tofu': 'Dinner',
};

const recipeStatusOverrides: Record<string, RecipeStatus> = {
  'Blueberry Lemon Muffins': 'draft',
  'Dark Chocolate Energy Bites': 'draft',
  'Apple Cinnamon Crumble': 'archived',
  'Strawberry Shortcake Cups': 'archived',
};

const recipeImageOverrides: Record<string, string | null> = {
  'Tomato Basil Bruschetta': null,
};

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
  categoryName: categoryOverrides[recipe.name] ?? recipe.categoryName,
  mealName: mealOverrides[recipe.name] ?? recipe.mealName,
  imageUrl: Object.prototype.hasOwnProperty.call(recipeImageOverrides, recipe.name)
    ? recipeImageOverrides[recipe.name]
    : recipe.imageUrl,
  dateAdded: new Date(Date.UTC(2026, 7, 1 + index, 8, 0, 0)),
}));

if (demoRecipes.length !== 25) {
  throw new Error(`Expected exactly 25 demo recipes, got ${demoRecipes.length}`);
}

type IngredientUnit =
  | 'GRAM'
  | 'KILOGRAM'
  | 'MILLILITER'
  | 'LITER'
  | 'TEASPOON'
  | 'TABLESPOON'
  | 'CUP'
  | 'PIECE';

type StructuredIngredientSeed = {
  name: string;
  quantity: number | null;
  quantityText: string | null;
  unit: IngredientUnit | null;
  unitText: string | null;
  preparation: string | null;
  originalText: string;
  note: string | null;
};

const unitLabels: Record<IngredientUnit, string> = {
  GRAM: 'g',
  KILOGRAM: 'kg',
  MILLILITER: 'ml',
  LITER: 'l',
  TEASPOON: 'tsp',
  TABLESPOON: 'tbsp',
  CUP: 'cup',
  PIECE: 'piece',
};

const structuredIngredient = (
  name: string,
  quantity: number | null,
  unit: IngredientUnit | null,
  preparation?: string,
  quantityText?: string,
): StructuredIngredientSeed => {
  const readableQuantity = quantityText ?? (quantity === null ? '' : String(quantity));
  const readableUnit = unit ? unitLabels[unit] : '';
  const originalText = [readableQuantity, readableUnit, name, preparation ? `, ${preparation}` : '']
    .join(' ')
    .replace(' ,', ',')
    .trim();

  return {
    name,
    quantity,
    quantityText: quantityText ?? (quantity === null ? null : String(quantity)),
    unit,
    unitText: unit ? readableUnit : null,
    preparation: preparation ?? null,
    originalText,
    note: null,
  };
};

const structuredIngredientOverrides: Record<string, StructuredIngredientSeed[]> = {
  'Classic Vietnamese Pho': [
    structuredIngredient('beef bones', 500, 'GRAM'),
    structuredIngredient('rice noodles', 250, 'GRAM'),
    structuredIngredient('yellow onion', 1, 'PIECE', 'charred'),
    structuredIngredient('ginger', 1, 'PIECE', 'sliced'),
    structuredIngredient('lime', 1, 'PIECE', 'cut into wedges'),
  ],
  'Avocado Toast with Chili': [
    structuredIngredient('sourdough bread', 2, 'PIECE', 'toasted'),
    structuredIngredient('avocado', 1, 'PIECE', 'mashed'),
    structuredIngredient('lemon juice', 1, 'TABLESPOON'),
    structuredIngredient('chili flakes', 1, 'TEASPOON'),
  ],
  'Lemongrass Chicken Rice': [
    structuredIngredient('chicken thighs', 500, 'GRAM'),
    structuredIngredient('lemongrass', 2, 'PIECE', 'minced'),
    structuredIngredient('fish sauce', 2, 'TABLESPOON'),
    structuredIngredient('jasmine rice', 2, 'CUP', 'cooked'),
    structuredIngredient('garlic', 3, 'PIECE', 'minced'),
  ],
  'Greek Chickpea Salad': [
    structuredIngredient('chickpeas', 400, 'GRAM', 'cooked'),
    structuredIngredient('cucumber', 1, 'PIECE', 'diced'),
    structuredIngredient('tomatoes', 2, 'PIECE', 'diced'),
    structuredIngredient('feta', 80, 'GRAM', 'crumbled'),
    structuredIngredient('olives', 60, 'GRAM'),
  ],
  'Tofu Banh Mi': [
    structuredIngredient('baguettes', 2, 'PIECE'),
    structuredIngredient('firm tofu', 300, 'GRAM'),
    structuredIngredient('carrot', 1, 'PIECE', 'julienned'),
    structuredIngredient('daikon', 1, 'PIECE', 'julienned'),
    structuredIngredient('soy sauce', 2, 'TABLESPOON'),
  ],
  'Coconut Curry Lentils': [
    structuredIngredient('red lentils', 250, 'GRAM'),
    structuredIngredient('coconut milk', 400, 'MILLILITER'),
    structuredIngredient('diced tomatoes', 400, 'GRAM'),
    structuredIngredient('spinach', 100, 'GRAM'),
    structuredIngredient('rice', 2, 'CUP', 'cooked'),
  ],
  'Roasted Pumpkin Soup': [
    structuredIngredient('pumpkin', 800, 'GRAM', 'cubed'),
    structuredIngredient('onion', 1, 'PIECE', 'quartered'),
    structuredIngredient('vegetable stock', 500, 'MILLILITER'),
    structuredIngredient('coconut milk', 200, 'MILLILITER'),
    structuredIngredient('pumpkin seeds', 30, 'GRAM', 'toasted'),
  ],
  'Lemon Herb Roasted Salmon': [
    structuredIngredient('salmon fillets', 2, 'PIECE'),
    structuredIngredient('lemon', 1, 'PIECE'),
    structuredIngredient('dill', 10, 'GRAM'),
    structuredIngredient('asparagus', 200, 'GRAM'),
    structuredIngredient('baby potatoes', 300, 'GRAM'),
  ],
  'Spicy Tuna Rice Bowl': [
    structuredIngredient('tuna cans', 2, 'PIECE'),
    structuredIngredient('rice', 2, 'CUP', 'cooked'),
    structuredIngredient('avocado', 1, 'PIECE'),
    structuredIngredient('cucumber', 1, 'PIECE', 'sliced'),
    structuredIngredient('mayonnaise', 2, 'TABLESPOON'),
  ],
  'Caprese Pasta Salad': [
    structuredIngredient('short pasta', 250, 'GRAM'),
    structuredIngredient('cherry tomatoes', 200, 'GRAM'),
    structuredIngredient('mozzarella pearls', 150, 'GRAM'),
    structuredIngredient('basil', 20, 'GRAM'),
    structuredIngredient('pesto', 2, 'TABLESPOON'),
  ],
  'Honey Soy Glazed Tofu': [
    structuredIngredient('firm tofu', 400, 'GRAM'),
    structuredIngredient('soy sauce', 2, 'TABLESPOON'),
    structuredIngredient('honey', 1, 'TABLESPOON'),
    structuredIngredient('broccoli', 300, 'GRAM'),
    structuredIngredient('rice', 2, 'CUP', 'cooked'),
  ],
  'Mango Coconut Chia Pudding': [
    structuredIngredient('coconut milk', 400, 'MILLILITER'),
    structuredIngredient('chia seeds', 60, 'GRAM'),
    structuredIngredient('mango', 1, 'PIECE', 'ripe'),
    structuredIngredient('maple syrup', 1, 'TABLESPOON'),
    structuredIngredient('coconut flakes', 20, 'GRAM', 'toasted'),
  ],
  'Banana Oat Pancakes': [
    structuredIngredient('banana', 1, 'PIECE', 'ripe'),
    structuredIngredient('rolled oats', 100, 'GRAM'),
    structuredIngredient('egg', 1, 'PIECE'),
    structuredIngredient('milk', 120, 'MILLILITER'),
    structuredIngredient('cinnamon', 1, 'TEASPOON'),
    structuredIngredient('baking powder', 1, 'TEASPOON'),
  ],
  'Berry Yogurt Parfait': [
    structuredIngredient('Greek yogurt', 400, 'GRAM'),
    structuredIngredient('mixed berries', 150, 'GRAM'),
    structuredIngredient('granola', 80, 'GRAM'),
    structuredIngredient('honey', 1, 'TABLESPOON'),
  ],
  'Garlic Butter Shrimp Pasta': [
    structuredIngredient('spaghetti', 250, 'GRAM'),
    structuredIngredient('peeled shrimp', 300, 'GRAM'),
    structuredIngredient('garlic', 4, 'PIECE', 'minced'),
    structuredIngredient('butter', 30, 'GRAM'),
    structuredIngredient('lemon', 1, 'PIECE'),
    structuredIngredient('parsley', 15, 'GRAM'),
    structuredIngredient('parmesan', 30, 'GRAM'),
  ],
  'Tomato Basil Bruschetta': [
    structuredIngredient('baguette', 1, 'PIECE'),
    structuredIngredient('ripe tomatoes', 3, 'PIECE'),
    structuredIngredient('basil', 15, 'GRAM'),
    structuredIngredient('garlic', 2, 'PIECE'),
    structuredIngredient('olive oil', 2, 'TABLESPOON'),
    structuredIngredient('balsamic vinegar', 1, 'TABLESPOON'),
  ],
  'Chicken Caesar Wrap': [
    structuredIngredient('chicken breasts', 2, 'PIECE'),
    structuredIngredient('large tortillas', 2, 'PIECE'),
    structuredIngredient('romaine lettuce', 80, 'GRAM'),
    structuredIngredient('parmesan', 40, 'GRAM'),
    structuredIngredient('Caesar dressing', 60, 'MILLILITER'),
    structuredIngredient('black pepper', 1, 'TEASPOON'),
  ],
  'Vietnamese Fresh Spring Rolls': [
    structuredIngredient('rice paper wrappers', 12, 'PIECE'),
    structuredIngredient('shrimp', 200, 'GRAM'),
    structuredIngredient('rice vermicelli', 150, 'GRAM'),
    structuredIngredient('lettuce', 80, 'GRAM'),
    structuredIngredient('mint', 15, 'GRAM'),
    structuredIngredient('cucumber', 1, 'PIECE'),
    structuredIngredient('peanut dipping sauce', 100, 'MILLILITER'),
  ],
  'Chocolate Banana Smoothie Bowl': [
    structuredIngredient('frozen bananas', 2, 'PIECE'),
    structuredIngredient('cocoa powder', 2, 'TABLESPOON'),
    structuredIngredient('milk', 100, 'MILLILITER'),
    structuredIngredient('peanut butter', 2, 'TABLESPOON'),
    structuredIngredient('almonds', 20, 'GRAM'),
    structuredIngredient('cacao nibs', 10, 'GRAM'),
  ],
  'Apple Cinnamon Crumble': [
    structuredIngredient('apples', 5, 'PIECE'),
    structuredIngredient('rolled oats', 100, 'GRAM'),
    structuredIngredient('flour', 80, 'GRAM'),
    structuredIngredient('brown sugar', 80, 'GRAM'),
    structuredIngredient('cinnamon', 1, 'TEASPOON'),
    structuredIngredient('butter', 60, 'GRAM'),
    structuredIngredient('lemon juice', 1, 'TABLESPOON'),
  ],
  'Strawberry Shortcake Cups': [
    structuredIngredient('strawberries', 400, 'GRAM'),
    structuredIngredient('sponge cake', 200, 'GRAM'),
    structuredIngredient('whipping cream', 250, 'MILLILITER'),
    structuredIngredient('sugar', 2, 'TABLESPOON'),
    structuredIngredient('vanilla extract', 1, 'TEASPOON'),
  ],
  'Sesame Peanut Noodles': [
    structuredIngredient('wheat noodles', 250, 'GRAM'),
    structuredIngredient('peanut butter', 3, 'TABLESPOON'),
    structuredIngredient('soy sauce', 2, 'TABLESPOON'),
    structuredIngredient('sesame oil', 1, 'TABLESPOON'),
    structuredIngredient('rice vinegar', 1, 'TABLESPOON'),
    structuredIngredient('carrot', 1, 'PIECE'),
    structuredIngredient('cucumber', 1, 'PIECE'),
    structuredIngredient('scallions', 2, 'PIECE'),
  ],
  'Crispy Potato Tacos': [
    structuredIngredient('potatoes', 500, 'GRAM'),
    structuredIngredient('corn tortillas', 8, 'PIECE'),
    structuredIngredient('cabbage', 100, 'GRAM'),
    structuredIngredient('lime', 1, 'PIECE'),
    structuredIngredient('cilantro', 15, 'GRAM'),
    structuredIngredient('chipotle sauce', 4, 'TABLESPOON'),
    structuredIngredient('cumin', 1, 'TEASPOON'),
    structuredIngredient('cotija cheese', 80, 'GRAM'),
  ],
  'Blueberry Lemon Muffins': [
    structuredIngredient('flour', 200, 'GRAM'),
    structuredIngredient('blueberries', 150, 'GRAM'),
    structuredIngredient('lemon', 1, 'PIECE'),
    structuredIngredient('milk', 120, 'MILLILITER'),
    structuredIngredient('egg', 1, 'PIECE'),
    structuredIngredient('butter', 80, 'GRAM'),
    structuredIngredient('sugar', 100, 'GRAM'),
  ],
  'Dark Chocolate Energy Bites': [
    structuredIngredient('dates', 150, 'GRAM'),
    structuredIngredient('rolled oats', 100, 'GRAM'),
    structuredIngredient('peanut butter', 2, 'TABLESPOON'),
    structuredIngredient('dark chocolate', 50, 'GRAM'),
    structuredIngredient('cocoa', 2, 'TABLESPOON'),
    structuredIngredient('coconut', 30, 'GRAM'),
  ],
};

const fallbackStructuredIngredients = (recipe: (typeof demoRecipes)[number]): StructuredIngredientSeed[] => {
  throw new Error(`Missing quantified structured ingredients for seed recipe: ${recipe.name}`);
};

const dietaryTagsByRecipe: Record<string, string[]> = {
  'Classic Vietnamese Pho': ['high-protein'],
  'Avocado Toast with Chili': ['vegetarian'],
  'Mango Coconut Chia Pudding': ['vegan', 'dairy-free', 'gluten-free'],
  'Banana Oat Pancakes': ['vegetarian'],
  'Greek Chickpea Salad': ['vegetarian', 'gluten-free'],
  'Tofu Banh Mi': ['vegetarian', 'dairy-free'],
  'Coconut Curry Lentils': ['vegan', 'dairy-free', 'gluten-free'],
  'Roasted Pumpkin Soup': ['vegan', 'dairy-free', 'gluten-free'],
  'Vietnamese Fresh Spring Rolls': ['dairy-free'],
  'Chocolate Banana Smoothie Bowl': ['vegetarian'],
  'Caprese Pasta Salad': ['vegetarian'],
  'Crispy Potato Tacos': ['vegetarian'],
  'Honey Soy Glazed Tofu': ['vegetarian', 'dairy-free'],
  'Dark Chocolate Energy Bites': ['vegetarian', 'dairy-free'],
};

const allergensByRecipe: Record<string, Array<{ name: string; source: string; sourceReference?: string }>> = {
  'Classic Vietnamese Pho': [{ name: 'fish', source: 'provided_by_author' }],
  'Avocado Toast with Chili': [{ name: 'wheat', source: 'provided_by_author' }],
  'Mango Coconut Chia Pudding': [{ name: 'tree_nuts', source: 'estimated' }],
  'Lemongrass Chicken Rice': [{ name: 'fish', source: 'provided_by_author' }],
  'Banana Oat Pancakes': [
    { name: 'eggs', source: 'provided_by_author' },
    { name: 'milk', source: 'provided_by_author' },
  ],
  'Berry Yogurt Parfait': [{ name: 'milk', source: 'provided_by_author' }],
  'Garlic Butter Shrimp Pasta': [
    { name: 'shellfish', source: 'provided_by_author' },
    { name: 'milk', source: 'provided_by_author' },
    { name: 'wheat', source: 'provided_by_author' },
  ],
  'Greek Chickpea Salad': [{ name: 'milk', source: 'provided_by_author' }],
  'Tofu Banh Mi': [
    { name: 'soy', source: 'provided_by_author' },
    { name: 'wheat', source: 'provided_by_author' },
  ],
  'Lemon Herb Roasted Salmon': [{ name: 'fish', source: 'verified_external', sourceReference: 'https://fdc.nal.usda.gov/' }],
  'Chicken Caesar Wrap': [
    { name: 'milk', source: 'provided_by_author' },
    { name: 'wheat', source: 'provided_by_author' },
  ],
  'Spicy Tuna Rice Bowl': [
    { name: 'fish', source: 'provided_by_author' },
    { name: 'eggs', source: 'estimated' },
  ],
  'Vietnamese Fresh Spring Rolls': [
    { name: 'shellfish', source: 'provided_by_author' },
    { name: 'peanuts', source: 'provided_by_author' },
  ],
  'Chocolate Banana Smoothie Bowl': [{ name: 'peanuts', source: 'provided_by_author' }],
  'Apple Cinnamon Crumble': [
    { name: 'milk', source: 'provided_by_author' },
    { name: 'wheat', source: 'provided_by_author' },
  ],
  'Strawberry Shortcake Cups': [
    { name: 'milk', source: 'provided_by_author' },
    { name: 'eggs', source: 'provided_by_author' },
    { name: 'wheat', source: 'provided_by_author' },
  ],
  'Sesame Peanut Noodles': [
    { name: 'peanuts', source: 'provided_by_author' },
    { name: 'soy', source: 'provided_by_author' },
    { name: 'wheat', source: 'provided_by_author' },
    { name: 'sesame', source: 'provided_by_author' },
  ],
  'Caprese Pasta Salad': [
    { name: 'milk', source: 'provided_by_author' },
    { name: 'wheat', source: 'provided_by_author' },
  ],
  'Honey Soy Glazed Tofu': [
    { name: 'soy', source: 'provided_by_author' },
    { name: 'sesame', source: 'provided_by_author' },
  ],
  'Blueberry Lemon Muffins': [
    { name: 'milk', source: 'provided_by_author' },
    { name: 'eggs', source: 'provided_by_author' },
    { name: 'wheat', source: 'provided_by_author' },
  ],
  'Dark Chocolate Energy Bites': [{ name: 'peanuts', source: 'provided_by_author' }],
};

const recipesWithoutMetadata = new Set([
  'Chocolate Banana Smoothie Bowl',
  'Crispy Potato Tacos',
  'Dark Chocolate Energy Bites',
]);

const demoWishlistDefinitions = [
  {
    userEmail: 'demo.homecook@foodrecipes.local',
    recipeNames: [
      'Classic Vietnamese Pho',
      'Avocado Toast with Chili',
      'Lemon Herb Roasted Salmon',
      'Coconut Curry Lentils',
      'Honey Soy Glazed Tofu',
    ],
  },
  {
    userEmail: 'demo.foodie@foodrecipes.local',
    recipeNames: [
      'Garlic Butter Shrimp Pasta',
      'Mango Coconut Chia Pudding',
      'Vietnamese Fresh Spring Rolls',
      'Caprese Pasta Salad',
    ],
  },
  {
    userEmail: 'demo.chef@foodrecipes.local',
    recipeNames: [
      'Greek Chickpea Salad',
      'Roasted Pumpkin Soup',
      'Spicy Tuna Rice Bowl',
      'Banana Oat Pancakes',
    ],
  },
] as const;

const demoCollectionDefinitions = [
  {
    userEmail: 'demo.homecook@foodrecipes.local',
    name: 'Weeknight dinners',
    recipeNames: ['Lemongrass Chicken Rice', 'Coconut Curry Lentils', 'Spicy Tuna Rice Bowl', 'Honey Soy Glazed Tofu'],
  },
  {
    userEmail: 'demo.homecook@foodrecipes.local',
    name: 'Vegetarian favorites',
    recipeNames: ['Greek Chickpea Salad', 'Tofu Banh Mi', 'Roasted Pumpkin Soup', 'Caprese Pasta Salad'],
  },
  {
    userEmail: 'demo.foodie@foodrecipes.local',
    name: 'Try this weekend',
    recipeNames: ['Classic Vietnamese Pho', 'Garlic Butter Shrimp Pasta', 'Vietnamese Fresh Spring Rolls'],
  },
] as const;

const demoPantryItems = [
  { name: 'rice', quantity: 2, unit: 'CUP', have: true },
  { name: 'avocado', quantity: 2, unit: 'PIECE', have: true },
  { name: 'garlic', quantity: 10, unit: 'PIECE', have: true },
  { name: 'cucumber', quantity: 3, unit: 'PIECE', have: true },
  { name: 'tofu', quantity: 800, unit: 'GRAM', have: true },
  { name: 'tomatoes', quantity: 6, unit: 'PIECE', have: true },
  { name: 'lemon', quantity: 3, unit: 'PIECE', have: true },
  { name: 'salmon', quantity: 2, unit: 'PIECE', have: false },
] as const;

const demoNoteDefinitions = [
  { recipeName: 'Classic Vietnamese Pho', note: 'Try a little less salt and add extra lime at the table.' },
  { recipeName: 'Coconut Curry Lentils', note: 'Double the lentils for tomorrow\'s lunch.' },
  { recipeName: 'Honey Soy Glazed Tofu', note: 'Press the tofu for at least 20 minutes before frying.' },
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
  status: RecipeStatus,
): Promise<number> => {
  const publishedAt = status === 'draft' ? null : new Date(recipe.dateAdded.getTime() + 24 * 60 * 60 * 1000);
  const archivedAt = status === 'archived' ? new Date(recipe.dateAdded.getTime() + 5 * 24 * 60 * 60 * 1000) : null;
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
      "instructions",
      "status",
      "published_at",
      "archived_at",
      "updated_at"
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
      ${recipe.instructions},
      ${status},
      ${publishedAt},
      ${archivedAt},
      ${recipe.dateAdded}
    )
    RETURNING "recipe_id"
  `);

  const recipeId = rows[0]?.recipe_id;
  if (!recipeId) {
    throw new Error(`Recipe was not inserted: ${recipe.name}`);
  }

  return Number(recipeId);
};

const startOfUtcDay = (value: Date): Date =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

const addDays = (value: Date, days: number): Date =>
  new Date(value.getTime() + days * 24 * 60 * 60 * 1000);

const seed = async (): Promise<void> => {
  const passwordHash = await hash(DEMO_PASSWORD, 10);
  const today = startOfUtcDay(new Date());
  const summary = await prisma.$transaction(async (client) => {
    const demoUserEmails = demoUsers.map((user) => user.email);
    const demoRecipeNames = demoRecipes.map((recipe) => recipe.name);
    const existingUsers = await client.user.findMany({
      where: { email: { in: demoUserEmails } },
      select: { id: true },
    });
    const existingUserIds = existingUsers.map((user) => user.id);
    const existingRecipes = await client.recipe.findMany({
      where: { name: { in: demoRecipeNames } },
      select: { id: true },
    });
    const existingRecipeIds = existingRecipes.map((recipe) => recipe.id);

    // Reset only rows owned by this demo graph. Foreign keys still protect
    // unrelated application data from being removed by the seed.
    if (existingUserIds.length) {
      await client.reviewReport.deleteMany({
        where: {
          OR: [
            { reporterUserId: { in: existingUserIds } },
            { resolvedBy: { in: existingUserIds } },
          ],
        },
      });
      await client.authSession.deleteMany({ where: { userId: { in: existingUserIds } } });
      await client.passwordResetToken.deleteMany({ where: { userId: { in: existingUserIds } } });
      await client.emailVerificationToken.deleteMany({ where: { userId: { in: existingUserIds } } });
      await client.recipeNote.deleteMany({ where: { userId: { in: existingUserIds } } });
      await client.cookingIngredientUsage.deleteMany({ where: { userId: { in: existingUserIds } } });
      await client.cookingHistory.deleteMany({ where: { userId: { in: existingUserIds } } });
      await client.cookingSession.deleteMany({ where: { userId: { in: existingUserIds } } });
      await client.pantryItem.deleteMany({ where: { userId: { in: existingUserIds } } });
      await client.shoppingListItem.deleteMany({ where: { userId: { in: existingUserIds } } });
      await client.mealPlan.deleteMany({ where: { userId: { in: existingUserIds } } });
      await client.wishlist.deleteMany({ where: { userId: { in: existingUserIds } } });
      await client.rating.deleteMany({ where: { userId: { in: existingUserIds } } });

      const existingCollections = await client.savedCollection.findMany({
        where: { userId: { in: existingUserIds } },
        select: { id: true },
      });
      if (existingCollections.length) {
        await client.savedCollectionItem.deleteMany({
          where: { collectionId: { in: existingCollections.map((collection) => collection.id) } },
        });
      }
      await client.savedCollection.deleteMany({ where: { userId: { in: existingUserIds } } });
    }

    if (existingRecipeIds.length) {
      await client.reviewReport.deleteMany({ where: { recipeId: { in: existingRecipeIds } } });
      await client.savedCollectionItem.deleteMany({ where: { recipeId: { in: existingRecipeIds } } });
      await client.rating.deleteMany({ where: { recipeId: { in: existingRecipeIds } } });
      await client.wishlist.deleteMany({ where: { recipeId: { in: existingRecipeIds } } });
      await client.recipe.deleteMany({ where: { id: { in: existingRecipeIds } } });
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
          role: user.role,
          emailVerifiedAt: today,
        },
        create: {
          fullName: user.fullName,
          email: user.email,
          password: passwordHash,
          createdOn: new Date('2026-08-15T08:00:00.000Z'),
          lastLogin: today,
          phone: user.phone,
          address: user.address,
          role: user.role,
          emailVerifiedAt: today,
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
    let structuredIngredientCount = 0;
    let nutritionCount = 0;
    let dietaryTagCount = 0;
    let allergenCount = 0;

    for (const [index, recipe] of demoRecipes.entries()) {
      const userId = users.get(recipe.authorEmail);
      const categoryId = categories.get(recipe.categoryName);
      const mealId = meals.get(recipe.mealName);
      const status = recipeStatusOverrides[recipe.name] ?? 'published';

      if (!userId || !categoryId || !mealId) {
        throw new Error(`Missing parent row for recipe: ${recipe.name}`);
      }

      const recipeId = await insertRecipe(client, recipe, userId, categoryId, mealId, status);
      recipes.set(recipe.name, recipeId);

      const structuredIngredients = structuredIngredientOverrides[recipe.name] ?? fallbackStructuredIngredients(recipe);
      for (const [position, ingredient] of structuredIngredients.entries()) {
        await client.recipeIngredient.create({
          data: {
            recipeId,
            position: position + 1,
            quantity: ingredient.quantity,
            quantityText: ingredient.quantityText,
            unit: ingredient.unit,
            unitText: ingredient.unitText,
            name: ingredient.name,
            preparation: ingredient.preparation,
            originalText: ingredient.originalText,
            note: ingredient.note,
          },
        });
        structuredIngredientCount += 1;
      }

      if (!recipesWithoutMetadata.has(recipe.name)) {
        const source = index % 5 === 0 ? 'verified_external' : index % 2 === 0 ? 'estimated' : 'provided_by_author';
        await client.recipeNutrition.create({
          data: {
            recipeId,
            servings: 2 + (index % 3),
            caloriesPerServing: 280 + ((index * 37) % 360),
            proteinGrams: 8 + ((index * 3) % 28),
            carbohydratesGrams: 20 + ((index * 7) % 55),
            fatGrams: 5 + ((index * 2) % 22),
            fiberGrams: 2 + (index % 8),
            sugarGrams: 3 + ((index * 2) % 18),
            sodiumMilligrams: 120 + ((index * 67) % 680),
            source,
            sourceReference: source === 'verified_external' ? 'https://fdc.nal.usda.gov/' : null,
          },
        });
        nutritionCount += 1;
      }

      for (const tag of dietaryTagsByRecipe[recipe.name] ?? []) {
        await client.recipeDietaryTag.create({ data: { recipeId, tag } });
        dietaryTagCount += 1;
      }

      for (const allergen of allergensByRecipe[recipe.name] ?? []) {
        await client.recipeAllergen.create({
          data: {
            recipeId,
            name: allergen.name,
            source: allergen.source,
            sourceReference: allergen.sourceReference ?? null,
          },
        });
        allergenCount += 1;
      }
    }

    const requireUserId = (email: string): number => {
      const id = users.get(email);
      if (!id) throw new Error(`Missing demo user: ${email}`);
      return id;
    };
    const requireRecipeId = (name: string): number => {
      const id = recipes.get(name);
      if (!id) throw new Error(`Missing demo recipe: ${name}`);
      return id;
    };

    let wishlistCount = 0;
    for (const [index, definition] of demoWishlistDefinitions.entries()) {
      const userId = requireUserId(definition.userEmail);
      for (const [recipeIndex, recipeName] of definition.recipeNames.entries()) {
        await client.wishlist.create({
          data: {
            userId,
            recipeId: requireRecipeId(recipeName),
            dateAdded: addDays(today, -(index * 5 + recipeIndex + 1)),
          },
        });
        wishlistCount += 1;
      }
    }

    const ratingIds = new Map<string, number>();
    let ratingCount = 0;
    const publishedRecipes = demoRecipes.filter(
      (recipe) => (recipeStatusOverrides[recipe.name] ?? 'published') === 'published',
    );
    for (const [index, recipe] of publishedRecipes.entries()) {
      // Keep one unrated recipe so the reviews empty state is visible.
      if (recipe.name === 'Chocolate Banana Smoothie Bowl') continue;

      const reviewers = demoRegularUserEmails.filter((email) => email !== recipe.authorEmail);
      for (const [reviewerIndex, reviewerEmail] of reviewers.entries()) {
        const score = reviewerIndex === 0
          ? (index % 4 === 0 ? 5 : 4)
          : (index % 5 === 0 ? 3 : 5);
        const row = await client.rating.create({
          data: {
            userId: requireUserId(reviewerEmail),
            recipeId: requireRecipeId(recipe.name),
            score: new Prisma.Decimal(score),
            review: reviewerIndex === 0
              ? `A dependable demo ${recipe.mealName.toLowerCase()} with clear, repeatable steps.`
              : `The flavors work well together; I would make this ${index % 2 === 0 ? 'on a busy weeknight' : 'for guests'}.`,
            dateAdded: addDays(today, -(index + reviewerIndex + 1)),
          },
        });
        ratingIds.set(`${recipe.name}:${reviewerEmail}`, row.id);
        ratingCount += 1;
      }
    }

    let collectionCount = 0;
    let collectionItemCount = 0;
    for (const [index, definition] of demoCollectionDefinitions.entries()) {
      const collection = await client.savedCollection.create({
        data: {
          userId: requireUserId(definition.userEmail),
          name: definition.name,
          createdAt: addDays(today, -(index + 10)),
          updatedAt: today,
        },
      });
      collectionCount += 1;
      for (const recipeName of definition.recipeNames) {
        await client.savedCollectionItem.create({
          data: { collectionId: collection.id, recipeId: requireRecipeId(recipeName), createdAt: today },
        });
        collectionItemCount += 1;
      }
    }

    for (const item of demoPantryItems) {
      await client.pantryItem.create({
        data: { userId: requireUserId('demo.homecook@foodrecipes.local'), name: item.name, quantity: item.quantity, unit: item.unit, have: item.have, updatedAt: today },
      });
    }

    const mealPlan = await client.mealPlan.create({
      data: {
        userId: requireUserId('demo.homecook@foodrecipes.local'),
        name: 'Demo weeknight plan',
        startDate: today,
        endDate: addDays(today, 6),
        createdAt: addDays(today, -2),
        updatedAt: today,
      },
    });
    const mealPlanItems = [
      { recipeName: 'Avocado Toast with Chili', day: 0, slot: 'breakfast', servings: 2 },
      { recipeName: 'Lemongrass Chicken Rice', day: 1, slot: 'dinner', servings: 3 },
      { recipeName: 'Greek Chickpea Salad', day: 2, slot: 'lunch', servings: 2 },
      { recipeName: 'Coconut Curry Lentils', day: 3, slot: 'dinner', servings: 4 },
      { recipeName: 'Mango Coconut Chia Pudding', day: 4, slot: 'snack', servings: 2 },
      { recipeName: 'Honey Soy Glazed Tofu', day: 5, slot: 'dinner', servings: 2 },
    ] as const;
    for (const item of mealPlanItems) {
      await client.mealPlanItem.create({
        data: {
          planId: mealPlan.id,
          recipeId: requireRecipeId(item.recipeName),
          plannedDate: addDays(today, item.day),
          slot: item.slot,
          servings: item.servings,
        },
      });
    }

    const homecookId = requireUserId('demo.homecook@foodrecipes.local');
    const activeRecipeId = requireRecipeId('Avocado Toast with Chili');
    const activePlanItem = await client.mealPlanItem.findFirst({
      where: { planId: mealPlan.id, recipeId: activeRecipeId },
      orderBy: { id: 'asc' },
    });
    if (!activePlanItem) throw new Error('Missing demo meal-plan item for the active cooking session');

    await client.cookingSession.create({
      data: {
        userId: homecookId,
        recipeId: activeRecipeId,
        mealPlanItemId: activePlanItem.id,
        servings: activePlanItem.servings,
        currentStep: 1,
        status: 'paused',
        startedAt: addDays(today, -1),
        lastActiveAt: today,
        pausedAt: today,
      },
    });

    const completedRecipeId = requireRecipeId('Roasted Pumpkin Soup');
    await client.cookingHistory.create({
      data: {
        userId: homecookId,
        recipeId: completedRecipeId,
        servings: 4,
        startedAt: addDays(today, -3),
        completedAt: addDays(today, -3),
        createdAt: addDays(today, -3),
      },
    });

    const shoppingListItems = [
      { label: 'rice noodles', quantity: '250 g', recipeName: 'Classic Vietnamese Pho', checked: false },
      { label: 'fresh cilantro', quantity: '1 bunch', recipeName: null, checked: false },
      { label: 'firm tofu', quantity: '400 g', recipeName: 'Honey Soy Glazed Tofu', checked: false },
      { label: 'limes', quantity: '3 pieces', recipeName: 'Classic Vietnamese Pho', checked: true },
    ] as const;
    for (const item of shoppingListItems) {
      await client.shoppingListItem.create({
        data: {
          userId: requireUserId('demo.homecook@foodrecipes.local'),
          label: item.label,
          quantity: item.quantity,
          sourceRecipeId: item.recipeName ? requireRecipeId(item.recipeName) : null,
          checked: item.checked,
        },
      });
    }

    for (const note of demoNoteDefinitions) {
      await client.recipeNote.create({
        data: {
          userId: requireUserId('demo.homecook@foodrecipes.local'),
          recipeId: requireRecipeId(note.recipeName),
          note: note.note,
          updatedAt: today,
        },
      });
    }

    const openReportRatingId = ratingIds.get('Classic Vietnamese Pho:demo.homecook@foodrecipes.local');
    const resolvedReportRatingId = ratingIds.get('Avocado Toast with Chili:demo.chef@foodrecipes.local');
    if (!openReportRatingId || !resolvedReportRatingId) {
      throw new Error('Missing demo ratings required for review moderation data');
    }

    await client.reviewReport.create({
      data: {
        ratingId: openReportRatingId,
        recipeId: requireRecipeId('Classic Vietnamese Pho'),
        reporterUserId: requireUserId('demo.foodie@foodrecipes.local'),
        reason: 'other',
        details: 'Demo report for the moderation queue: please review this comment.',
        status: 'open',
        createdAt: addDays(today, -1),
      },
    });
    await client.reviewReport.create({
      data: {
        ratingId: resolvedReportRatingId,
        recipeId: requireRecipeId('Avocado Toast with Chili'),
        reporterUserId: requireUserId('demo.foodie@foodrecipes.local'),
        reason: 'spam',
        details: 'Demo report already reviewed by the moderator.',
        status: 'resolved',
        resolutionNote: 'Demo report resolved after review.',
        createdAt: addDays(today, -4),
        resolvedAt: addDays(today, -3),
        resolvedBy: requireUserId('demo.admin@foodrecipes.local'),
      },
    });

    return {
      users: users.size,
      categories: categories.size,
      meals: meals.size,
      recipes: recipes.size,
      publishedRecipes: publishedRecipes.length,
      drafts: demoRecipes.filter((recipe) => (recipeStatusOverrides[recipe.name] ?? 'published') === 'draft').length,
      archivedRecipes: demoRecipes.filter((recipe) => recipeStatusOverrides[recipe.name] === 'archived').length,
      structuredIngredients: structuredIngredientCount,
      nutrition: nutritionCount,
      dietaryTags: dietaryTagCount,
      allergens: allergenCount,
      wishlists: wishlistCount,
      ratings: ratingCount,
      collections: collectionCount,
      collectionItems: collectionItemCount,
      pantryItems: demoPantryItems.length,
      mealPlans: 1,
      mealPlanItems: mealPlanItems.length,
      activeCookingSessions: 1,
      completedCookingHistory: 1,
      shoppingListItems: shoppingListItems.length,
      notes: demoNoteDefinitions.length,
      reviewReports: 2,
    };
  }, {
    maxWait: SEED_TRANSACTION_MAX_WAIT_MS,
    timeout: SEED_TRANSACTION_TIMEOUT_MS,
  });

  console.log('Seeded demo graph:');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`Demo password: ${DEMO_PASSWORD}`);
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
