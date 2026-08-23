import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '../../../../..');
const workflowPath = path.join(repositoryRoot, '.github/workflows/quality-gates.yml');
const workflow = await readFile(workflowPath, 'utf8');

const jobMatches = [...workflow.matchAll(/^  ([A-Za-z0-9_-]+):\r?\n/gm)];
const jobs = Object.fromEntries(
  jobMatches.map((match, index) => [
    match[1],
    workflow.slice(match.index, jobMatches[index + 1]?.index ?? workflow.length),
  ]),
);

const expectedJobs = [
  'install',
  'static',
  'prisma',
  'api-quality',
  'contract-e2e',
  'frontend',
  'docker-runtime-build',
  'migration-release-handoff',
];

for (const jobName of expectedJobs) {
  assert.ok(jobs[jobName], `workflow must define ${jobName}`);
}

assert.match(workflow, /^on:\r?\n/m, 'workflow must define event triggers');
assert.match(workflow, /^  pull_request:\s*$/m, 'workflow must run for pull requests');
assert.match(
  workflow,
  /^  push:\r?\n    branches:\r?\n      - main\s*$/m,
  'workflow must run for pushes to main',
);
assert.match(workflow, /uses: pnpm\/action-setup@v4/);
assert.match(workflow, /version: 11\.18\.0/);
assert.match(workflow, /uses: actions\/setup-node@v4/);
assert.match(workflow, /node-version: 24/);

const installJobs = expectedJobs.filter((jobName) => jobName !== 'docker-runtime-build');
for (const jobName of installJobs) {
  assert.match(
    jobs[jobName],
    /pnpm install --frozen-lockfile/,
    `${jobName} must install from the frozen lockfile`,
  );
}

for (const [jobName, dependency] of [
  ['static', 'install'],
  ['prisma', 'static'],
  ['api-quality', 'prisma'],
  ['contract-e2e', 'api-quality'],
  ['frontend', 'contract-e2e'],
  ['docker-runtime-build', 'frontend'],
  ['migration-release-handoff', 'docker-runtime-build'],
]) {
  assert.match(
    jobs[jobName],
    new RegExp(`^    needs: ${dependency}\\s*$`, 'm'),
    `${jobName} must run after ${dependency}`,
  );
}

assert.match(jobs.static, /ci-workflow\.validation\.mjs/);
assert.match(jobs.static, /prisma-baseline\.validation\.mjs/);
assert.match(jobs.static, /recipe-duration-migration\.validation\.mjs/);
assert.match(jobs.static, /docker-infrastructure\.validation\.mjs/);
assert.match(jobs.prisma, /prisma validate --config prisma\.ci\.config\.ts/);
assert.match(jobs.prisma, /prisma generate --config prisma\.ci\.config\.ts/);
assert.match(jobs['api-quality'], /tsc -p tsconfig\.build\.json --noEmit/);
assert.match(jobs['api-quality'], /pnpm --filter @food-recipes\/api test\s*$/m);
assert.match(jobs['contract-e2e'], /pnpm --filter @food-recipes\/api test:e2e/);
assert.match(jobs.frontend, /pnpm build/);
assert.match(
  jobs['docker-runtime-build'],
  /docker build --target runtime[\s\S]*src\/backend\/apps\/api\/Dockerfile/,
);

assert.match(
  jobs['migration-release-handoff'],
  /name: One-shot migration gate \/ release handoff/,
  'migration job must be clearly labelled as the release handoff',
);
assert.match(
  jobs['migration-release-handoff'],
  /if: github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/,
  'migration job must be limited to pushes on main',
);
assert.match(
  jobs['migration-release-handoff'],
  /DATABASE_URL:\s*\$\{\{ secrets\.DATABASE_URL \}\}/,
  'migration job must source DATABASE_URL from CI secrets',
);
assert.equal(
  workflow.split(/\r?\n/).filter((line) => line.includes('DATABASE_URL')).length,
  1,
  'DATABASE_URL must appear only in the secret-backed migration job',
);

const migrateCommands = workflow.match(/prisma migrate deploy/g) ?? [];
assert.equal(migrateCommands.length, 1, 'workflow must have exactly one migration deploy command');
assert.match(
  jobs['migration-release-handoff'],
  /prisma migrate deploy --config prisma\.config\.ts/,
  'migration deploy must be in the dedicated migration job',
);
assert.doesNotMatch(workflow, /prisma migrate reset/i, 'workflow must never reset a database');
assert.doesNotMatch(
  jobs['docker-runtime-build'],
  /migrate deploy/i,
  'Docker artifact validation must not run migrations per API artifact or replica',
);

console.log(
  'CI workflow static validation passed: triggers, pins, frozen installs, ordered needs, '
    + 'quality gates, runtime Docker build, secret-only migration URL, one-shot migration handoff, '
    + 'and no reset command were verified without database access.',
);
