import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');
const migrationPath = path.join(
  root,
  'prisma',
  'migrations',
  '20260828100000_user_food_preferences',
  'migration.sql',
);

assert.equal(existsSync(migrationPath), true, 'preference migration must exist');

const migration = await readFile(migrationPath, 'utf8');
const schema = await readFile(path.join(root, 'prisma/schema.prisma'), 'utf8');

for (const table of [
  'user_food_preferences',
  'user_avoided_allergens',
  'user_disliked_ingredients',
  'user_cuisine_preferences',
]) {
  assert.match(migration, new RegExp(`CREATE TABLE "${table}"`, 'i'));
  assert.match(migration, new RegExp(`FOREIGN KEY \\("user_id"\\) REFERENCES "accounts"`, 'i'));
}

assert.match(migration, /user_food_preferences_default_servings_check[\s\S]*"default_servings" BETWEEN 1 AND 24/i);
assert.match(
  migration,
  /user_food_preferences_weekday_cook_minutes_check[\s\S]*"max_weekday_cook_minutes" IS NULL[\s\S]*BETWEEN 10 AND 240/i,
);
assert.match(
  migration,
  /user_food_preferences_calories_check[\s\S]*"max_calories_per_serving" IS NULL[\s\S]*BETWEEN 100 AND 5000/i,
);
assert.match(
  migration,
  /user_food_preferences_protein_check[\s\S]*"min_protein_grams" IS NULL[\s\S]*BETWEEN 0 AND 300/i,
);
assert.match(migration, /user_cuisine_preferences_weight_check[\s\S]*"weight" BETWEEN -2 AND 2/i);

assert.match(migration, /UNIQUE \("user_id", "allergen"\)/i);
assert.match(migration, /UNIQUE \("user_id", "ingredient_name"\)/i);
assert.match(migration, /UNIQUE \("user_id", "cuisine"\)/i);
assert.match(migration, /CREATE INDEX "user_avoided_allergens_user_idx"/i);
assert.match(migration, /CREATE INDEX "user_disliked_ingredients_user_idx"/i);
assert.match(migration, /CREATE INDEX "user_cuisine_preferences_user_idx"/i);
assert.doesNotMatch(migration, /DROP\s+(TABLE|COLUMN)/i);

for (const model of [
  'UserFoodPreference',
  'UserAvoidedAllergen',
  'UserDislikedIngredient',
  'UserCuisinePreference',
]) {
  assert.match(schema, new RegExp(`model ${model} \\{`, 'i'));
}

assert.match(schema, /userId\s+Int\s+@id\s+@map\("user_id"\)/);
assert.match(schema, /defaultServings\s+Int\s+@default\(2\)\s+@map\("default_servings"\)/);
assert.match(schema, /maxWeekdayCookMinutes\s+Int\?\s+@map\("max_weekday_cook_minutes"\)/);
assert.match(schema, /maxCaloriesPerServing\s+Int\?\s+@map\("max_calories_per_serving"\)/);
assert.match(schema, /minProteinGrams\s+Float\?\s+@map\("min_protein_grams"\)/);
assert.match(schema, /strictDislikes\s+Boolean\s+@default\(false\)\s+@map\("strict_dislikes"\)/);
assert.match(schema, /@@unique\(\[userId, allergen\]\)/);
assert.match(schema, /@@unique\(\[userId, ingredientName\]\)/);
assert.match(schema, /@@unique\(\[userId, cuisine\]\)/);
assert.match(schema, /weight\s+Int\s+@default\(1\)/);

console.log('User food preferences migration validation passed.');
