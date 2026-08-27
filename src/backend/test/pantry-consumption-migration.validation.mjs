import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const migration = await readFile(path.resolve(testDirectory, '../prisma/migrations/20260827100000_add_pantry_consumption/migration.sql'), 'utf8');
const schema = await readFile(path.resolve(testDirectory, '../prisma/schema.prisma'), 'utf8');

assert.match(migration, /ADD COLUMN "quantity" DECIMAL/i);
assert.match(migration, /ADD COLUMN "unit"/i);
assert.match(migration, /CREATE TABLE "cooking_ingredient_usage"/i);
assert.match(migration, /cooking_ingredient_usage_unit_check/i);
assert.doesNotMatch(migration, /DROP COLUMN "name"|DROP COLUMN "have"/i);
assert.match(schema, /quantity\s+Decimal\?\s+@db\.Decimal\(12, 3\)/);
assert.match(schema, /model CookingIngredientUsage/);
console.log('Pantry consumption migration validation passed.');
