import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '../../..');
const workflowPath = path.join(repositoryRoot, '.github/workflows/quality-gates.yml');
const workflow = await readFile(workflowPath, 'utf8');

const jobsSectionMatch = workflow.match(/^jobs:\r?\n([\s\S]*)$/m);
assert.ok(jobsSectionMatch, 'workflow must define a jobs section');
const jobsSection = jobsSectionMatch[1];
const jobMatches = [...jobsSection.matchAll(/^  ([A-Za-z0-9_-]+):\r?$/gm)];
const jobs = Object.fromEntries(
  jobMatches.map((match, index) => [
    match[1],
    jobsSection.slice(match.index, jobMatches[index + 1]?.index ?? jobsSection.length),
  ]),
);

const expectedJobs = [
  'install',
  'static',
  'prisma',
  'api-quality',
  'contract-e2e',
  'frontend',
  'frontend-e2e',
  'docker-runtime-build',
  'migration-release-handoff',
];

for (const jobName of expectedJobs) {
  assert.ok(jobs[jobName], `workflow must define ${jobName}`);
}
assert.deepEqual(
  Object.keys(jobs),
  expectedJobs,
  'workflow jobs must remain the expected quality-gate jobs in order',
);

assert.match(workflow, /^on:\r?\n/m, 'workflow must define event triggers');
assert.match(workflow, /^  pull_request:\s*$/m, 'workflow must run for pull requests');
assert.match(
  workflow,
  /^  push:\r?\n    branches:\r?\n      - main\s*$/m,
  'workflow must run for pushes to main',
);
assert.match(
  workflow,
  /^permissions:\r?\n  contents: read\r?\n\r?\njobs:\r?\n/m,
  'workflow must grant only top-level read access to repository contents',
);
assert.equal(
  (workflow.match(/^permissions:/gm) ?? []).length,
  1,
  'workflow must define one top-level permissions block',
);

const assertJobContains = (jobName, pattern, message) => {
  assert.match(jobs[jobName], pattern, message ?? `${jobName} must contain ${pattern}`);
};

const assertJobNeeds = (jobName, dependency) => {
  const needsMatch = jobs[jobName].match(/^    needs: ([A-Za-z0-9_-]+)\s*$/m);
  assert.equal(
    needsMatch?.[1],
    dependency,
    `${jobName} must run after ${dependency} and have no alternate dependency`,
  );
};

const pinnedJobs = expectedJobs.filter(
  (jobName) => !['install', 'static', 'docker-runtime-build'].includes(jobName),
);
for (const jobName of pinnedJobs) {
  assertJobContains(jobName, /^      - uses: actions\/checkout@v4\s*$/m);
  assertJobContains(
    jobName,
    /- uses: pnpm\/action-setup@v4\r?\n\s+with:\r?\n\s+version: 11\.18\.0/m,
    `${jobName} must pin pnpm 11.18.0`,
  );
  assertJobContains(
    jobName,
    /- uses: actions\/setup-node@v4\r?\n\s+with:\r?\n\s+node-version: 24\r?\n\s+cache: pnpm/m,
    `${jobName} must pin Node 24 and enable the pnpm cache`,
  );
}

for (const jobName of pinnedJobs) {
  assertJobContains(
    jobName,
    /pnpm install --frozen-lockfile/,
    `${jobName} must install from the frozen lockfile`,
  );
}

assert.doesNotMatch(jobs.install, /^    needs:/m, 'install must be the root quality-gate job');
for (const [jobName, dependency] of [
  ['static', 'install'],
  ['prisma', 'static'],
  ['api-quality', 'prisma'],
  ['contract-e2e', 'api-quality'],
  ['frontend', 'contract-e2e'],
  ['docker-runtime-build', 'frontend-e2e'],
  ['migration-release-handoff', 'docker-runtime-build'],
]) {
  assertJobNeeds(jobName, dependency);
}

assert.match(jobs.static, /ci-workflow\.validation\.mjs/);
assert.match(jobs.static, /prisma-baseline\.validation\.mjs/);
assert.match(jobs.static, /recipe-duration-migration\.validation\.mjs/);
assert.match(jobs.static, /docker-infrastructure\.validation\.mjs/);
assert.match(jobs.static, /backend-product-security\.validation\.mjs/);
assertJobContains('prisma', /prisma validate --config prisma\.ci\.config\.ts/);
assertJobContains('prisma', /prisma generate --config prisma\.ci\.config\.ts/);
assertJobContains('prisma', /url: 'postgresql:\/\/127\.0\.0\.1:1\/ci_validation'/);
assertJobContains('prisma', /trap 'rm -f prisma\.ci\.config\.ts' EXIT/);
assertJobContains('api-quality', /pnpm typecheck\s*$/m);
assertJobContains('api-quality', /pnpm test\s*$/m);
assertJobContains('api-quality', /pnpm audit --audit-level high --ignore GHSA-ggr8-5vv4-36mx/);
assertJobContains('contract-e2e', /pnpm test:e2e\s*$/m);
assertJobContains('frontend', /pnpm build/);
assert.match(
  jobs['docker-runtime-build'],
  /docker build --target runtime[\s\S]*--file src\/backend\/Dockerfile src\/backend/,
);

for (const jobName of ['prisma', 'api-quality', 'contract-e2e', 'migration-release-handoff']) {
  assertJobContains(
    jobName,
    /working-directory: src\/backend[\s\S]*run: pnpm install --frozen-lockfile/,
    `${jobName} must install dependencies inside the backend package`,
  );
}
for (const jobName of ['frontend', 'frontend-e2e']) {
  assertJobContains(
    jobName,
    /working-directory: src\/frontend[\s\S]*run: pnpm install --frozen-lockfile/,
    `${jobName} must install dependencies inside the frontend package`,
  );
}

for (const jobName of ['api-quality', 'contract-e2e']) {
  assertJobContains(
    jobName,
    /name: Generate Prisma Client offline/,
    `${jobName} must generate Prisma Client on its own runner`,
  );
  assertJobContains(jobName, /working-directory: src\/backend/);
  assertJobContains(jobName, /shell: bash/);
  assertJobContains(jobName, /cat > prisma\.ci\.config\.ts/);
  assertJobContains(
    jobName,
    /url: 'postgresql:\/\/127\.0\.0\.1:1\/ci_validation'/,
    `${jobName} Prisma generation must use a non-routable temporary datasource URL`,
  );
  assertJobContains(jobName, /pnpm exec prisma generate --config prisma\.ci\.config\.ts/);
  assertJobContains(jobName, /trap 'rm -f prisma\.ci\.config\.ts' EXIT/);
  assert.doesNotMatch(
    jobs[jobName],
    /DATABASE_URL|prisma migrate/i,
    `${jobName} must not connect to or migrate a database`,
  );
}

for (const jobName of expectedJobs.filter((name) => name !== 'migration-release-handoff')) {
  assert.doesNotMatch(
    jobs[jobName],
    /DATABASE_URL|prisma migrate/i,
    `${jobName} must not read a database secret or run a migration`,
  );
}

assertJobContains(
  'docker-runtime-build',
  /^      - uses: actions\/checkout@v4\s*$/m,
  'Docker build must retain its checkout step',
);
assert.doesNotMatch(
  jobs['docker-runtime-build'],
  /pnpm install --frozen-lockfile/,
  'Docker build must retain its existing image-build behavior',
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
assertJobContains(
  'migration-release-handoff',
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
