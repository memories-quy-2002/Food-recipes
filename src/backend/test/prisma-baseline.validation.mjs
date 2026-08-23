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
  report: path.join(repositoryRoot, '.superpowers/sdd/task-5-report.md'),
  legacyDump: path.join(apiDirectory, 'prisma/legacy/recipes.sql'),
  compose: path.join(repositoryRoot, 'src/backend/infrastructure/docker/docker-compose.yml'),
};

const contents = Object.fromEntries(
  await Promise.all(
    Object.entries(files).map(async ([name, filePath]) => [
      name,
      await readFile(filePath, name === 'legacyDump' ? 'utf16le' : 'utf8'),
    ]),
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

const legacyRecipesTableMatch = contents.legacyDump.match(
  /CREATE TABLE public\.recipes \(([\s\S]*?)\r?\n\);/m,
);
assert.ok(legacyRecipesTableMatch, 'recipes.sql must contain the legacy recipes table definition');

const legacyRecipesCopyMatch = contents.legacyDump.match(
  /COPY public\.recipes \(([^)]*)\) FROM stdin;/m,
);
assert.ok(legacyRecipesCopyMatch, 'recipes.sql must contain the legacy recipes COPY column list');

const legacyWishlistTableMatch = contents.legacyDump.match(
  /CREATE TABLE public\.wishlist \(([\s\S]*?)\r?\n\);/m,
);
assert.ok(legacyWishlistTableMatch, 'recipes.sql must contain the legacy wishlist table definition');

const requiredColumns = {
  accounts: [
    ['user_id', 'SERIAL NOT NULL'],
    ['full_name', 'VARCHAR\\(124\\) NOT NULL'],
    ['password', 'VARCHAR\\(255\\) NOT NULL'],
    ['email', 'VARCHAR\\(255\\) NOT NULL'],
    ['created_on', 'TIMESTAMP\\(6\\) NOT NULL'],
    ['last_login', 'TIMESTAMP\\(6\\)'],
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
    ['date_added', 'TIMESTAMP\\(6\\) DEFAULT CURRENT_TIMESTAMP'],
    ['user_id', 'INTEGER NOT NULL DEFAULT 0'],
    ['image_url', 'TEXT'],
    ['ingredients', 'TEXT\\[\\]'],
    ['instructions', 'TEXT\\[\\]'],
  ],
  wishlist: [
    ['wishlist_id', 'SERIAL NOT NULL'],
    ['user_id', 'INTEGER NOT NULL'],
    ['recipe_id', 'INTEGER NOT NULL'],
    ['date_added', 'TIMESTAMP\\(6\\) DEFAULT CURRENT_TIMESTAMP'],
  ],
  rating: [
    ['rating_id', 'SERIAL NOT NULL'],
    ['user_id', 'INTEGER NOT NULL'],
    ['recipe_id', 'INTEGER NOT NULL'],
    ['score', 'DECIMAL\\(10,2\\)'],
    ['review', 'TEXT'],
    ['date_added', 'TIMESTAMP\\(6\\) DEFAULT CURRENT_TIMESTAMP'],
  ],
};

for (const [tableName, columns] of Object.entries(requiredColumns)) {
  const table = migrationTable(tableName);
  for (const [columnName, typePattern] of columns) {
    assert.match(table, new RegExp(`"${columnName}"\\s+${typePattern}`), `${tableName}.${columnName} is missing or mismatched`);
  }
}

for (const [tableName, constraintName, columnName] of [
  ['accounts', 'accounts_pkey', 'user_id'],
  ['categories', 'categories_pkey', 'category_id'],
  ['meals', 'meals_pkey', 'meal_id'],
  ['recipes', 'recipes_pkey', 'recipe_id'],
  ['wishlist', 'wishlist_pkey', 'wishlist_id'],
  ['rating', 'rating_pkey', 'rating_id'],
]) {
  assert.match(
    migrationTable(tableName),
    new RegExp(`CONSTRAINT "${constraintName}" PRIMARY KEY \\("${columnName}"\\)`),
    `${tableName} must preserve ${constraintName}`,
  );
}

for (const [tableName, constraintName, checkPattern] of [
  ['recipes', 'prep_time_check', /"prep_time"\s*>\s*'00:00:00'::interval/],
  ['recipes', 'cook_time_check', /"cook_time"\s*>\s*'00:00:00'::interval/],
  ['rating', 'rating_score_check', /score\)::double precision\s*>=\s*\(0\.0\)::double precision[\s\S]*score\)::double precision\s*<=\s*\(5\.0\)::double precision/],
]) {
  const table = migrationTable(tableName);
  assert.match(table, new RegExp(`CONSTRAINT "${constraintName}" CHECK`), `${tableName} must preserve ${constraintName}`);
  assert.match(table, checkPattern, `${tableName}.${constraintName} has the wrong predicate`);
}

for (const [constraintName, tableName, columnName, referencedTable, referencedColumn, actions] of [
  ['rafk_user_id', 'recipes', 'user_id', 'accounts', 'user_id', 'ON DELETE RESTRICT ON UPDATE NO ACTION'],
  ['rcfk_category_id', 'recipes', 'category_id', 'categories', 'category_id', 'ON DELETE SET NULL ON UPDATE NO ACTION'],
  ['rmfk_meal_id', 'recipes', 'meal_id', 'meals', 'meal_id', 'ON DELETE SET NULL ON UPDATE NO ACTION'],
  ['rtafk_user_id', 'rating', 'user_id', 'accounts', 'user_id', 'ON UPDATE CASCADE ON DELETE CASCADE'],
  ['rtrfk_user_id', 'rating', 'recipe_id', 'recipes', 'recipe_id', 'ON UPDATE CASCADE ON DELETE CASCADE'],
  ['wafk_user_id', 'wishlist', 'user_id', 'accounts', 'user_id', 'ON DELETE CASCADE ON UPDATE NO ACTION'],
  ['wrfk_recipe_id', 'wishlist', 'recipe_id', 'recipes', 'recipe_id', 'ON DELETE CASCADE ON UPDATE NO ACTION'],
]) {
  assert.match(
    contents.migration,
    new RegExp(
      `CONSTRAINT "${constraintName}" FOREIGN KEY \\("${columnName}"\\) REFERENCES "${referencedTable}"\\("${referencedColumn}"\\) ${actions}`,
    ),
    `baseline must preserve foreign key ${constraintName}`,
  );
}

assert.match(contents.schema, /prepTime\s+Unsupported\("interval"\)\s+@map\("prep_time"\)/);
assert.match(contents.schema, /cookTime\s+Unsupported\("interval"\)\s+@map\("cook_time"\)/);
assert.match(contents.schema, /imageUrl\s+String\?\s+@map\("image_url"\)/);
const wishlistModelMatch = contents.schema.match(/model Wishlist \{([\s\S]*?)\n\}/m);
assert.ok(wishlistModelMatch, 'schema must define Wishlist');
assert.match(
  wishlistModelMatch[1],
  /^\s*dateAdded\s+DateTime\?\s+@default\(now\(\)\)\s+@map\("date_added"\)\s+@db\.Timestamp\(6\)/m,
  'Wishlist.dateAdded must remain nullable with a now default and timestamp precision 6',
);
for (const field of ['createdOn', 'lastLogin']) {
  assert.match(
    contents.schema,
    new RegExp(`^\\s*${field}\\s+DateTime\\??.*@db\\.Timestamp\\(6\\)`, 'm'),
    `${field} must preserve legacy timestamp precision 6`,
  );
}
assert.equal(
  contents.schema.match(/^\s*dateAdded\s+DateTime\??.*@db\.Timestamp\(6\)/gm)?.length,
  3,
  'all dateAdded fields must preserve legacy timestamp precision 6',
);
assert.match(contents.migration, /CREATE SCHEMA IF NOT EXISTS "public";/);
for (const index of [
  /CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"\("email"\);/,
  /CREATE UNIQUE INDEX "user_recipe_constraint" ON "wishlist"\("user_id", "recipe_id"\);/,
  /CREATE UNIQUE INDEX "unique_user_recipe_pair" ON "rating"\("user_id", "recipe_id"\);/,
]) {
  assert.match(contents.migration, index, `baseline is missing required index ${index}`);
}

assert.doesNotMatch(legacyRecipesTableMatch[1], /\bimage_url\b/i, 'recipes.sql evidence must document the missing image_url column');
assert.doesNotMatch(legacyRecipesCopyMatch[1], /\bimage_url\b/i, 'recipes.sql COPY evidence must document the missing image_url column');
assert.match(
  legacyWishlistTableMatch[1],
  /date_added\s+timestamp without time zone DEFAULT CURRENT_TIMESTAMP/i,
  'recipes.sql wishlist.date_added must be nullable with a current-timestamp default',
);
assert.doesNotMatch(
  legacyWishlistTableMatch[1],
  /date_added\s+timestamp without time zone\s+NOT NULL/i,
  'recipes.sql wishlist.date_added must remain nullable',
);
for (const [name, document] of [['API README', contents.readme], ['Task 5 report', contents.report]]) {
  assert.match(document, /Known legacy evidence discrepancy:/i, `${name} must label the image_url discrepancy`);
  assert.match(document, /`prisma\/schema\.prisma`/, `${name} must name the checked-in Prisma schema`);
  assert.match(document, /`recipes\.sql` evidence omits `image_url`/, `${name} must name the omitted legacy column`);
  assert.match(document, /live database or\s+a disposable restored copy/i, `${name} must require live or disposable-copy inspection`);
  assert.match(document, /Before `prisma migrate resolve --applied 0_init`/i, `${name} must gate baseline marking on inspection`);
}

for (const destructivePattern of [
  /\bDROP\b/i,
  /(?:^|;)\s*DELETE\b/i,
  /\bTRUNCATE\b/i,
  /\bINSERT\b/i,
  /(?:^|;)\s*UPDATE\b/i,
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

console.log(
  'Prisma baseline static validation passed without Docker or database access; '
    + 'legacy timestamp precision, wishlist nullability, and the image_url discrepancy were checked and documented, '
    + 'so live or disposable-copy inspection remains required before marking 0_init applied.',
);
