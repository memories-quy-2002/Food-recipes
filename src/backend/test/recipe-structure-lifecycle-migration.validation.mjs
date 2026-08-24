import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const migration = await readFile(
  join(
    root,
    'prisma',
    'migrations',
    '20260824090000_add_recipe_structure_nutrition_lifecycle',
    'migration.sql',
  ),
  'utf8',
);
const extensionMigration = await readFile(
  join(
    root,
    'prisma',
    'migrations',
    '20260824170000_extend_recipe_structure_lifecycle',
    'migration.sql',
  ),
  'utf8',
);
const structuredIngredientMigration = await readFile(
  join(
    root,
    'prisma',
    'migrations',
    '20260824151000_add_structured_recipe_ingredients',
    'migration.sql',
  ),
  'utf8',
);
const metadataMigration = await readFile(
  join(root, 'prisma', 'migrations', '20260824160000_add_recipe_metadata', 'migration.sql'),
  'utf8',
);

assert.match(migration, /status.*published/i);
assert.match(migration, /recipe_dietary_tags/i);
assert.doesNotMatch(migration, /DROP\s+TABLE\s+recipes/i);
assert.match(extensionMigration, /recipe_ingredients/i);
assert.match(extensionMigration, /quantity_text/i);
assert.match(extensionMigration, /unit_text/i);
assert.match(extensionMigration, /recipe_nutrition/i);
assert.match(extensionMigration, /servings/i);
assert.match(structuredIngredientMigration, /CREATE TABLE\s+"recipe_ingredients"/i);
assert.match(metadataMigration, /CREATE TABLE\s+"recipe_nutrition"/i);
assert.doesNotMatch(migration, /CREATE TABLE\s+"recipe_ingredients"/i);
assert.doesNotMatch(migration, /CREATE TABLE\s+"recipe_nutrition"/i);
assert.doesNotMatch(migration, /recipe_allergen_tags/i);

console.log('recipe structure lifecycle migration contract passed');
