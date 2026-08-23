import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const apiDirectory = path.resolve(testDirectory, '..');
const repositoryRoot = path.resolve(apiDirectory, '../..');

const files = {
  migration: path.join(apiDirectory, 'prisma/migrations/0_init/migration.sql'),
  schema: path.join(apiDirectory, 'prisma/schema.prisma'),
  readme: path.join(apiDirectory, 'README.prisma.md'),
  legacySchema: path.join(apiDirectory, 'prisma/legacy/recipes.sql'),
  compose: path.join(repositoryRoot, 'src/backend/infrastructure/docker/docker-compose.yml'),
};

const contents = Object.fromEntries(
  await Promise.all(
    Object.entries(files).map(async ([name, filePath]) => [name, await readFile(filePath, 'utf8')]),
  ),
);

const withoutSqlComments = (sql) =>
  sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*--.*$/gm, '');
const sql = withoutSqlComments(contents.migration).replace(/\s+/g, ' ');

for (const tableName of ['accounts', 'categories', 'meals', 'recipes', 'wishlist', 'rating']) {
  assert.match(contents.migration, new RegExp(`CREATE TABLE "${tableName}"`), `baseline must create ${tableName}`);
  assert.match(contents.legacySchema, new RegExp(`CREATE TABLE public\\.${tableName}`), `legacy schema must document ${tableName}`);
}

assert.match(contents.schema, /prepTime\s+Unsupported\("interval"\)\s+@map\("prep_time"\)/);
assert.match(contents.schema, /cookTime\s+Unsupported\("interval"\)\s+@map\("cook_time"\)/);
assert.match(contents.schema, /imageUrl\s+String\?\s+@map\("image_url"\)/);
assert.doesNotMatch(contents.legacySchema, /\bimage_url\b/i, 'legacy evidence must document the historical image_url discrepancy');
assert.doesNotMatch(contents.legacySchema, /\bCOPY\b|\bINSERT\b/i, 'legacy evidence must be schema-only and contain no application rows');
assert.doesNotMatch(contents.legacySchema, /@|gmail|bcrypt|\$2[aby]\$/i, 'legacy evidence must not contain user data or password hashes');

assert.match(
  contents.legacySchema,
  /date_added\s+timestamp without time zone DEFAULT CURRENT_TIMESTAMP/i,
  'legacy schema must preserve nullable wishlist date default evidence',
);

assert.match(contents.readme, /Known legacy evidence discrepancy:/i);
assert.match(contents.readme, /`prisma\/schema\.prisma`/);
assert.match(contents.readme, /`recipes\.sql` evidence omits `image_url`/);
assert.match(contents.readme, /live database or\s+a disposable restored copy/i);
assert.match(contents.readme, /Before `prisma migrate resolve --applied 0_init`/i);

for (const destructivePattern of [
  /\bDROP\b/i,
  /(?:^|;)\s*DELETE\b/i,
  /\bTRUNCATE\b/i,
  /\bINSERT\b/i,
  /(?:^|;)\s*UPDATE\b/i,
  /\bCOPY\b/i,
  /\bRESET\b/i,
]) {
  assert.doesNotMatch(sql, destructivePattern, `baseline contains forbidden SQL: ${destructivePattern}`);
}

assert.match(contents.readme, /pg_dump[\s\S]*backup/i);
assert.match(contents.readme, /disposable development database|disposable copy/i);
assert.match(contents.readme, /migrate resolve --applied 0_init/i);
assert.match(contents.readme, /migrate status/i);
assert.match(contents.readme, /Never run `prisma migrate reset`/i);
assert.doesNotMatch(contents.compose, /migrate reset/i);
assert.match(contents.compose, /prisma migrate deploy|prisma",\s*"migrate",\s*"deploy/);

console.log('Prisma baseline validation passed with schema-only legacy evidence and no sensitive data dependency.');
