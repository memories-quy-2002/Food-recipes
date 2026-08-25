import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '../../..');
const workflowPath = path.join(repositoryRoot, '.github/workflows/quality-gates.yml');
const baselineWorkflowPath = path.join(
  repositoryRoot,
  '.github/workflows/production-prisma-baseline.yml',
);
const [workflow, baselineWorkflow] = await Promise.all([
  readFile(workflowPath, 'utf8'),
  readFile(baselineWorkflowPath, 'utf8'),
]);

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

const expectedJobs = ['static', 'backend', 'frontend'];

assert.deepEqual(Object.keys(jobs), expectedJobs, 'quality gates must stay minimal and ordered');
assert.match(workflow, /^  pull_request:\s*$/m, 'workflow must run for pull requests');
assert.match(
  workflow,
  /^  push:\r?\n    branches:\r?\n      - master\s*$/m,
  'workflow must run for pushes to the repository release branch master',
);
assert.match(workflow, /^permissions:\r?\n  contents: read\s*$/m, 'workflow must keep read-only repository permissions');

const assertJobContains = (jobName, pattern, message) => {
  assert.match(jobs[jobName], pattern, message ?? `${jobName} must contain ${pattern}`);
};
assertJobContains('static', /actions\/setup-node@v4[\s\S]*node-version: 24/, 'static validators must use Node 24');
for (const validator of [
  'ci-workflow.validation.mjs',
  'prisma-baseline.validation.mjs',
  'recipe-duration-migration.validation.mjs',
  'docker-infrastructure.validation.mjs',
  'backend-product-security.validation.mjs',
]) {
  assertJobContains('static', new RegExp(validator.replace('.', '\\.')));
}

for (const jobName of ['backend', 'frontend']) {
  assertJobContains(jobName, /pnpm\/action-setup@v4[\s\S]*version: 11\.18\.0/);
  assertJobContains(jobName, /actions\/setup-node@v4[\s\S]*node-version: 24/);
  assertJobContains(jobName, /pnpm install --frozen-lockfile/);
}

assertJobContains('backend', /pnpm prisma:validate/);
assertJobContains('backend', /pnpm prisma:generate/);
assertJobContains('backend', /pnpm check/);
assertJobContains('backend', /pnpm test:e2e/);
assertJobContains('backend', /pnpm build/);
assertJobContains('frontend', /pnpm check/);
assertJobContains('frontend', /pnpm build/);
assertJobContains('backend', /docker build --target runtime[\s\S]*src\/backend\/Dockerfile src\/backend/);
assertJobContains('frontend', /pnpm exec playwright install --with-deps chromium/);
assertJobContains('frontend', /pnpm test:e2e:ci/);
assertJobContains('frontend', /actions\/upload-artifact@v4[\s\S]*retention-days: 7/);
assert.doesNotMatch(workflow, /contents:\s*write/i, 'quality gates must never request write permissions');
assert.doesNotMatch(workflow, /git push/i, 'quality gates must never push generated changes');
assert.doesNotMatch(workflow, /prisma:migrate:deploy/i, 'quality gates must not mutate a deployment database');
assert.doesNotMatch(workflow, /prisma migrate reset/i, 'CI must never reset a data-bearing database');

assert.match(
  baselineWorkflow,
  /^on:\r?\n  workflow_dispatch:/m,
  'production baseline must only be manually dispatched',
);
assert.doesNotMatch(
  baselineWorkflow,
  /^  (?:push|pull_request):/m,
  'production baseline must never run automatically',
);
assert.match(
  baselineWorkflow,
  /if:\s*\$\{\{ inputs\.confirm == 'BASELINE' \}\}/,
  'production baseline must require explicit BASELINE confirmation',
);
assert.match(
  baselineWorkflow,
  /DATABASE_URL:\s*\$\{\{ secrets\.PRODUCTION_DATABASE_URL \}\}/,
  'production baseline must use the production database secret',
);
assert.match(
  baselineWorkflow,
  /prisma migrate resolve --applied 0_init --config prisma\.config\.ts/,
  'production baseline must mark only 0_init as applied',
);
assert.match(
  baselineWorkflow,
  /pnpm prisma:migrate:deploy/,
  'production baseline must deploy remaining migrations after resolving 0_init',
);
assert.doesNotMatch(
  baselineWorkflow,
  /prisma migrate reset/i,
  'production baseline must never reset the production database',
);

console.log('CI workflow validation passed for master release flow, Node 24, quality gates, and guarded production baseline/migrations.');
