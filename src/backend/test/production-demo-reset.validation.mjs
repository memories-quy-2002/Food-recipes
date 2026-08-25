import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '../../..');
const backendRoot = path.resolve(testDirectory, '..');

const [script, workflow, packageJson] = await Promise.all([
  readFile(path.join(backendRoot, 'scripts/production-demo-reset.ts'), 'utf8'),
  readFile(path.join(repositoryRoot, '.github/workflows/production-demo-reset.yml'), 'utf8'),
  readFile(path.join(backendRoot, 'package.json'), 'utf8'),
]);

assert.match(script, /NODE_ENV !== 'production'/, 'reset script must require production mode');
assert.match(script, /PRODUCTION_DEMO_RESET_ENABLED !== 'true'/, 'reset script must have an enable kill switch');
assert.match(script, /RESET_FOOD_RECIPES_PRODUCTION/, 'reset script must require exact destructive confirmation');
assert.match(script, /BACKUP_VERIFIED/, 'reset script must require backup confirmation');
assert.match(script, /PRODUCTION_DEMO_PROJECT_REF/, 'reset script must validate the production project ref');
assert.match(script, /PRODUCTION_DEMO_DB_HOST/, 'reset script must validate the production database host');
assert.match(script, /TRUNCATE TABLE/, 'reset script must truncate data explicitly');
assert.match(script, /_prisma_migrations/, 'reset script must name the protected Prisma migration table');
assert.match(script, /SUPABASE_SERVICE_ROLE_KEY/, 'Storage cleanup must require the server-side key');
assert.match(script, /\/object\/list\//, 'Storage cleanup must use the Storage API list endpoint');
assert.match(script, /method: 'DELETE'/, 'Storage cleanup must use the Storage API delete method');
assert.match(script, /object\/\$\{encodeURIComponent\(bucket\)\}/, 'Storage cleanup must target the bucket object endpoint');
assert.doesNotMatch(script, /prisma\s+migrate\s+reset/i, 'production reset must not use Prisma migrate reset');
assert.doesNotMatch(script, /DROP\s+SCHEMA/i, 'production reset must not drop a schema');
assert.doesNotMatch(script, /storage\.objects/i, 'Storage cleanup must not delete through SQL');

assert.match(workflow, /^on:\r?\n  workflow_dispatch:/m, 'production reset must be manually dispatched');
assert.doesNotMatch(workflow, /^  (?:push|pull_request):/m, 'production reset must never run on push or pull request');
assert.match(workflow, /environment: production-demo-reset/, 'reset must require the protected GitHub Environment');
assert.match(workflow, /needs: preflight/, 'destructive job must depend on preflight');
assert.match(workflow, /quality-gates\.yml/, 'preflight must check Quality Gates');
assert.match(workflow, /--commit \"\$GITHUB_SHA\"/, 'preflight must check the same commit');
assert.match(workflow, /pnpm demo:reset:production/, 'workflow must call the guarded reset command');
assert.match(workflow, /pnpm demo:verify/, 'workflow must verify seeded data');
assert.doesNotMatch(workflow, /prisma\s+migrate\s+reset/i, 'workflow must not use Prisma migrate reset');

const packageConfig = JSON.parse(packageJson);
assert.equal(
  packageConfig.scripts['demo:reset:production'],
  'ts-node --transpile-only scripts/production-demo-reset.ts',
);
assert.equal(
  packageConfig.scripts['demo:verify'],
  'ts-node --transpile-only scripts/verify-demo-seed.ts',
);

console.log('Production demo reset safety validation passed.');
