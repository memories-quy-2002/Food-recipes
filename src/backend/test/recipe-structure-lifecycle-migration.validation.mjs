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

assert.match(migration, /status.*published/i);
assert.match(migration, /recipe_ingredients/i);
assert.match(migration, /recipe_nutrition/i);
assert.match(migration, /recipe_dietary_tags/i);
assert.match(migration, /recipe_allergen_tags/i);
assert.match(migration, /unnest\s*\(.*ingredients/i);
assert.match(migration, /original_text/i);
assert.doesNotMatch(migration, /DROP\s+TABLE\s+recipes/i);

console.log('recipe structure lifecycle migration contract passed');
