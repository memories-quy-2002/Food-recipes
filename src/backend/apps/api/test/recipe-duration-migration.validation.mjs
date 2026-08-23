import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const apiDirectory = path.resolve(testDirectory, '..');
const migrationPath = path.join(
  apiDirectory,
  'prisma/migrations/20260823093000_normalize_recipe_duration/migration.sql',
);
const schemaPath = path.join(apiDirectory, 'prisma/schema.prisma');
const repositoryPath = path.join(
  apiDirectory,
  'src/modules/recipes/recipes.repository.ts',
);
const wishlistRepositoryPath = path.join(
  apiDirectory,
  'src/modules/wishlist/wishlist.repository.ts',
);
const expressQueriesPath = path.resolve(
  apiDirectory,
  '../../../server/queries.js',
);

const [migration, schema, repository, wishlistRepository, expressQueries] = await Promise.all([
  readFile(migrationPath, 'utf8'),
  readFile(schemaPath, 'utf8'),
  readFile(repositoryPath, 'utf8'),
  readFile(wishlistRepositoryPath, 'utf8'),
  readFile(expressQueriesPath, 'utf8'),
]);

const sql = migration
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*--.*$/gm, '')
  .replace(/\s+/g, ' ')
  .trim();

const at = (fragment) => {
  const index = sql.indexOf(fragment);
  assert.notEqual(index, -1, `migration is missing: ${fragment}`);
  return index;
};

const addColumnsAt = at('ADD COLUMN "prep_time_minutes" INTEGER, ADD COLUMN "cook_time_minutes" INTEGER');
const backfillAt = at('UPDATE "recipes" SET');
const validationAt = at('IF EXISTS ( SELECT 1 FROM "recipes"');
const checksAt = at('ADD CONSTRAINT "prep_time_minutes_positive_check"');
const notNullAt = at('ALTER COLUMN "prep_time_minutes" SET NOT NULL');

assert.ok(addColumnsAt < backfillAt, 'minute columns must be added before backfill');
assert.ok(backfillAt < validationAt, 'backfill must run before validation');
assert.ok(validationAt < checksAt, 'validation must run before positive checks');
assert.ok(checksAt < notNullAt, 'checks must be added before NOT NULL');
assert.match(sql, /ROUND\(EXTRACT\(EPOCH FROM prep_time\) \/ 60\)::integer/);
assert.match(sql, /ROUND\(EXTRACT\(EPOCH FROM cook_time\) \/ 60\)::integer/);
assert.match(sql, /"prep_time_minutes" IS NULL/);
assert.match(sql, /"prep_time_minutes" <= 0/);
assert.match(sql, /"cook_time_minutes" IS NULL/);
assert.match(sql, /"cook_time_minutes" <= 0/);
assert.match(sql, /CHECK \("prep_time_minutes" IS NOT NULL AND "prep_time_minutes" > 0\)/);
assert.match(sql, /CHECK \("cook_time_minutes" IS NOT NULL AND "cook_time_minutes" > 0\)/);
assert.match(sql, /ALTER COLUMN "cook_time_minutes" SET NOT NULL/);
assert.doesNotMatch(sql, /\bDROP\b/i, 'Task 18 migration must not contain DROP');
assert.match(sql, /\bprep_time\b/i, 'legacy prep_time must remain referenced by the migration');
assert.match(sql, /\bcook_time\b/i, 'legacy cook_time must remain referenced by the migration');
assert.doesNotMatch(sql, /DROP\s+COLUMN\s+"?(?:prep_time|cook_time)"?/i);

assert.match(schema, /prepTimeMinutes\s+Int\s+@map\("prep_time_minutes"\)/);
assert.match(schema, /cookTimeMinutes\s+Int\s+@map\("cook_time_minutes"\)/);
assert.match(schema, /prepTime\s+Unsupported\("interval"\)\s+@map\("prep_time"\)/);
assert.match(schema, /cookTime\s+Unsupported\("interval"\)\s+@map\("cook_time"\)/);

for (const source of [repository, wishlistRepository]) {
  assert.match(source, /r\.prep_time_minutes/);
  assert.match(source, /r\.cook_time_minutes/);
  assert.doesNotMatch(source, /EXTRACT\(EPOCH FROM r\.(?:prep_time|cook_time)\)/);
}
assert.match(repository, /prep_time_minutes, cook_time_minutes, prep_time, cook_time/);
assert.match(repository, /make_interval\(mins => \$\{dto\.prepTimeMinutes\}\)/);
assert.match(repository, /make_interval\(mins => \$\{dto\.cookTimeMinutes\}\)/);
assert.match(repository, /prep_time_minutes = COALESCE/);
assert.match(repository, /cook_time_minutes = COALESCE/);

const addRecipeStart = expressQueries.indexOf('const addRecipe =');
const deleteRecipeStart = expressQueries.indexOf('const deleteRecipe =', addRecipeStart);
assert.ok(addRecipeStart >= 0, 'legacy Express addRecipe handler is missing');
assert.ok(deleteRecipeStart > addRecipeStart, 'could not isolate legacy Express addRecipe handler');
const addRecipeSource = expressQueries.slice(addRecipeStart, deleteRecipeStart).replace(/\s+/g, ' ');
assert.match(
  addRecipeSource,
  /INSERT INTO recipes \([^)]*prep_time, cook_time, prep_time_minutes, cook_time_minutes/,
  'Express addRecipe must insert both legacy and native duration columns',
);
assert.match(
  addRecipeSource,
  /ROUND\(EXTRACT\(EPOCH FROM \$5::interval\) \/ 60\)::integer/,
  'Express addRecipe must derive prep_time_minutes from the parameterized prep interval',
);
assert.match(
  addRecipeSource,
  /ROUND\(EXTRACT\(EPOCH FROM \$6::interval\) \/ 60\)::integer/,
  'Express addRecipe must derive cook_time_minutes from the parameterized cook interval',
);

console.log(
  'Recipe duration migration static validation passed without database access: '
    + 'ordered backfill, positive checks, NOT NULL enforcement, native projections, '
    + 'Nest and Express dual-write compatibility, and no interval-column drop were verified.',
);
