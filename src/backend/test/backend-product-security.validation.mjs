import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '../../..');
const read = (relativePath) => readFile(path.join(repositoryRoot, relativePath), 'utf8');

const [schema, collections, planning, auth, media, delivery, main] = await Promise.all([
  read('src/backend/prisma/schema.prisma'),
  read('src/backend/src/modules/collections/collections.controller.ts'),
  read('src/backend/src/modules/planning/planning.controller.ts'),
  read('src/backend/src/modules/auth/auth-session.repository.ts'),
  read('src/backend/src/modules/media/media.service.ts'),
  read('src/backend/src/modules/auth/recovery-delivery.service.ts'),
  read('src/backend/src/main.ts'),
]);

for (const migrationName of [
  '20260823130000_add_collections_and_review_reports',
  '20260823133000_add_planning_tables',
  '20260823140000_add_auth_sessions_roles_and_recovery',
]) {
  const migration = await read(`src/backend/prisma/migrations/${migrationName}/migration.sql`);
  assert.match(migration, /CREATE TABLE/);
  assert.doesNotMatch(migration, /migrate reset/i);
}

assert.match(schema, /model SavedCollection/);
assert.match(schema, /model MealPlan/);
assert.match(schema, /model AuthSession/);
assert.match(schema, /role\s+String/);
assert.match(collections, /Controller\(\{ path: 'users\/me\/collections', version: '1' \}\)/);
assert.match(planning, /users\/me/);
assert.match(auth, /createHash\('sha256'\)/);
assert.match(auth, /randomBytes\(32\)/);
assert.match(media, /createHmac\('sha256'/);
assert.match(media, /SUPABASE_UPLOAD_GRANT_SECRET/);
assert.match(delivery, /AUTH_MAIL_WEBHOOK_URL/);
assert.match(main, /bodyParser: false/);
assert.match(main, /256kb/);
assert.match(main, /X-Content-Type-Options/);

console.log('Backend product/security static validation passed: additive schema, versioned guarded routes, hashed sessions, bounded bodies, and security headers were verified.');
