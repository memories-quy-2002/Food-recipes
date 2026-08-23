import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const apiDirectory = path.resolve(testDirectory, '..');
const repositoryRoot = path.resolve(apiDirectory, '../../../..');

const files = {
  migration: path.join(apiDirectory, 'prisma/migrations/0_init/migration.sql'),
  schema: path.join(apiDirectory, 'prisma/schema.prisma'),
  readme: path.join(apiDirectory, 'README.md'),
  compose: path.join(repositoryRoot, 'infrastructure/docker/docker-compose.yml'),
};

const contents = Object.fromEntries(
  await Promise.all(
    Object.entries(files).map(async ([name, filePath]) => [name, await readFile(filePath, 'utf8')]),
  ),
);

const withoutSqlComments = (sql) =>
  sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*--.*$/gm, '');

const sql = withoutSqlComments(contents.migration).replace(/\s+/g, ' ');
const migrationTable = (tableName) => {
  const match = contents.migration.match(
    new RegExp(`CREATE TABLE "${tableName}" \\(([\\s\\S]*?)\\n\\);`, 'm'),
  );
  assert.ok(match, `baseline must create ${tableName}`);
  return match[1].replace(/\s+/g, ' ');
};

const requiredColumns = {
  accounts: [
    ['user_id', 'SERIAL NOT NULL'],
    ['full_name', 'VARCHAR\\(124\\) NOT NULL'],
    ['password', 'VARCHAR\\(255\\) NOT NULL'],
    ['email', 'VARCHAR\\(255\\) NOT NULL'],
    ['created_on', 'TIMESTAMP\\(3\\) NOT NULL'],
    ['last_login', 'TIMESTAMP\\(3\\)'],
    ['phone', 'VARCHAR\\(20\\)'],
    ['address', 'VARCHAR\\(255\\)'],
  ],
  categories: [
    ['category_id', 'SERIAL NOT NULL'],
    ['category_name', 'VARCHAR\\(255\\) NOT NULL'],
  ],
  meals: [
    ['meal_id', 'SERIAL NOT NULL'],
    ['meal_name', 'VARCHAR\\(50\\) NOT NULL'],
    ['meal_description', 'TEXT'],
  ],
  recipes: [
    ['recipe_id', 'SERIAL NOT NULL'],
    ['recipe_name', 'VARCHAR\\(255\\) NOT NULL'],
    ['recipe_description', 'TEXT'],
    ['meal_id', 'INTEGER NOT NULL'],
    ['category_id', 'INTEGER NOT NULL'],
    ['prep_time', 'interval NOT NULL'],
    ['cook_time', 'interval NOT NULL'],
    ['date_added', 'TIMESTAMP\\(3\\) DEFAULT CURRENT_TIMESTAMP'],
    ['user_id', 'INTEGER NOT NULL DEFAULT 0'],
    ['image_url', 'TEXT'],
    ['ingredients', 'TEXT\\[\\]'],
    ['instructions', 'TEXT\\[\\]'],
  ],
  wishlist: [
    ['wishlist_id', 'SERIAL NOT NULL'],
    ['user_id', 'INTEGER NOT NULL'],
    ['recipe_id', 'INTEGER NOT NULL'],
    ['date_added', 'TIMESTAMP\\(3\\) NOT NULL DEFAULT CURRENT_TIMESTAMP'],
  ],
  rating: [
    ['rating_id', 'SERIAL NOT NULL'],
    ['user_id', 'INTEGER NOT NULL'],
    ['recipe_id', 'INTEGER NOT NULL'],
    ['score', 'DECIMAL\\(10,2\\)'],
    ['review', 'TEXT'],
    ['date_added', 'TIMESTAMP\\(3\\) DEFAULT CURRENT_TIMESTAMP'],
  ],
};

for (const [tableName, columns] of Object.entries(requiredColumns)) {
  const table = migrationTable(tableName);
  for (const [columnName, typePattern] of columns) {
    assert.match(table, new RegExp(`"${columnName}"\\s+${typePattern}`), `${tableName}.${columnName} is missing or mismatched`);
  }
}

assert.match(contents.schema, /prepTime\s+Unsupported\("interval"\)\s+@map\("prep_time"\)/);
assert.match(contents.schema, /cookTime\s+Unsupported\("interval"\)\s+@map\("cook_time"\)/);
assert.match(contents.schema, /imageUrl\s+String\?\s+@map\("image_url"\)/);
assert.match(contents.migration, /CREATE SCHEMA IF NOT EXISTS "public";/);
assert.match(contents.migration, /CREATE UNIQUE INDEX "accounts_email_key"/);
assert.match(contents.migration, /CREATE UNIQUE INDEX "user_recipe_constraint"/);
assert.match(contents.migration, /CREATE UNIQUE INDEX "unique_user_recipe_pair"/);

for (const destructivePattern of [
  /\bDROP\b/i,
  /\bDELETE\b/i,
  /\bTRUNCATE\b/i,
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bCOPY\b/i,
  /\bRESET\b/i,
  /ALTER TABLE[\s\S]*?\bDROP\b/i,
]) {
  assert.doesNotMatch(sql, destructivePattern, `baseline contains forbidden SQL: ${destructivePattern}`);
}

assert.match(contents.readme, /pg_dump[\s\S]*backup/i, 'README must require a backup before metadata changes');
assert.match(contents.readme, /disposable development database|disposable copy/i, 'README must require a disposable development copy');
assert.match(contents.readme, /Get-Content[\s\S]*migrate diff|inspect the migration/i, 'README must document inspection');
assert.match(contents.readme, /migrate resolve --applied 0_init/i, 'README must document marking the baseline applied');
assert.match(contents.readme, /migrate status/i, 'README must document migration status verification');
assert.match(contents.readme, /Never run `prisma migrate reset`/i, 'README must prohibit prisma migrate reset');
assert.doesNotMatch(contents.compose, /migrate reset/i, 'Docker migration configuration must not use migrate reset');
assert.match(contents.compose, /prisma migrate deploy|prisma",\s*"migrate",\s*"deploy/, 'Docker migration service must use migrate deploy');

console.log('Prisma baseline static validation passed without Docker or database access.');
