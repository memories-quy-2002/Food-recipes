import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const schema = await readFile(path.join(root, 'prisma/schema.prisma'), 'utf8');
const migrationPath = path.join(root, 'prisma/migrations/20260830130000_harden_leftover_provenance_and_sessions/migration.sql');
const migration = await readFile(migrationPath, 'utf8');
const leftoversMigration = await readFile(path.join(root, 'prisma/migrations/20260830120000_add_leftovers_and_meal_plan_sources/migration.sql'), 'utf8');

assert.match(schema, /model CookingHistory[\s\S]*sourceType\s+String[\s\S]*leftoverBatchId\s+Int\?/);
assert.match(migration, /DROP INDEX IF EXISTS "cooking_sessions_one_active_per_user_recipe_idx"/i);
assert.match(leftoversMigration, /cooking_sessions_active_plan_item_key/);
assert.match(migration, /ADD COLUMN "source_type" VARCHAR\(16\) NOT NULL DEFAULT 'recipe'/i);
assert.match(migration, /ADD COLUMN "leftover_batch_id" INTEGER/i);
assert.match(migration, /cooking_history_source_consistency_check/);
assert.match(migration, /cooking_history_leftover_fk[\s\S]*REFERENCES "leftover_batches"\("leftover_id"\) ON DELETE RESTRICT/i);
assert.match(migration, /source_type.*recipe.*leftover/i);
assert.match(migration, /cooking_history_one_per_plan_item_idx/);
console.log('cooking history P0.2 migration validation passed');
