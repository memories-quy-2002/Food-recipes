import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(testDirectory, '..');
const migrationPath = path.join(
  backendRoot,
  'prisma/migrations/20260914100000_harden_kitchen_loop_indexes/migration.sql',
);
const schemaPath = path.join(backendRoot, 'prisma/schema.prisma');

assert.equal(existsSync(migrationPath), true, 'kitchen-loop hardening migration must exist');

const [migration, schema] = await Promise.all([
  readFile(migrationPath, 'utf8'),
  readFile(schemaPath, 'utf8'),
]);
const compactMigration = migration.replace(/\s+/g, ' ');

for (const indexName of [
  'meal_plans_user_start_end_idx',
  'meal_plans_household_start_end_idx',
  'pantry_items_household_have_idx',
  'shopping_list_household_checked_idx',
  'shopping_list_user_unchecked_label_quantity_key',
  'shopping_list_household_unchecked_label_quantity_key',
]) {
  assert.match(migration, new RegExp(`(?:CREATE UNIQUE INDEX|CREATE INDEX) "${indexName}"`, 'i'), `${indexName} must be created`);
}

assert.match(migration, /DROP INDEX IF EXISTS "meal_plan_items_plan_date_idx"/i);
assert.match(compactMigration, /GROUP BY "user_id", LOWER\(BTRIM\("label"\)\), COALESCE\(BTRIM\("quantity"\), ''\)/i);
assert.match(compactMigration, /GROUP BY "household_id", LOWER\(BTRIM\("label"\)\), COALESCE\(BTRIM\("quantity"\), ''\)/i);
assert.match(migration, /WHERE "user_id" IS NOT NULL AND "checked" = FALSE/i);
assert.match(migration, /WHERE "household_id" IS NOT NULL AND "checked" = FALSE/i);

for (const schemaIndex of [
  'meal_plans_user_start_end_idx',
  'meal_plans_household_start_end_idx',
  'pantry_items_household_have_idx',
  'shopping_list_user_checked_idx',
  'shopping_list_household_checked_idx',
]) {
  assert.match(schema, new RegExp(`map: "${schemaIndex}"`), `${schemaIndex} must be represented in the Prisma schema`);
}
assert.match(schema, /@@unique\(\[planId, plannedDate, slot\], map: "meal_plan_items_plan_date_slot_key"\)/);
assert.match(schema, /@@index\(\[leftoverBatchId\], map: "meal_plan_items_leftover_idx"\)/);

for (const destructivePattern of [/DROP\s+TABLE/i, /DROP\s+COLUMN/i, /TRUNCATE/i, /(?:^|;)\s*DELETE\s+FROM/i]) {
  assert.doesNotMatch(migration, destructivePattern, `migration contains forbidden destructive SQL: ${destructivePattern}`);
}

console.log('Kitchen-loop migration validation passed for scoped indexes, duplicate prevention, and non-destructive rollout safety.');
