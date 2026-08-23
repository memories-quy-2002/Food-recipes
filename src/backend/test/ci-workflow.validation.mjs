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
  'static',
  'backend',
  'frontend',
  'frontend-e2e',
  'docker-runtime-build',
  'migration-release-handoff',
];

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
const assertJobNeeds = (jobName, dependency) => {
  assert.match(jobs[jobName], new RegExp(`^    needs: ${dependency}\\s*$`, 'm'), `${jobName} must depend on ${dependency}`);
};

assert.doesNotMatch(jobs.static, /^    needs:/m, 'static validators must be the root quality gate');
for (const [jobName, dependency] of [
  ['backend', 'static'],
  ['frontend', 'backend'],
  ['frontend-e2e', 'frontend'],
  ['docker-runtime-build', 'frontend-e2e'],
  ['migration-release-handoff', 'docker-runtime-build'],
]) {
  assertJobNeeds(jobName, dependency);
}

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

for (const jobName of ['backend', 'frontend', 'frontend-e2e', 'migration-release-handoff']) {
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
assertJobContains('frontend-e2e', /pnpm test:e2e:ci/);
assertJobContains('docker-runtime-build', /docker build --target runtime[\s\S]*src\/backend\/Dockerfile src\/backend/);

assert.match(
  jobs['migration-release-handoff'],
  /if: github\.event_name == 'push' && github\.ref == 'refs\/heads\/master'/,
  'migration handoff must only run after pushes to master',
);
assertJobContains('migration-release-handoff', /DATABASE_URL:\s*\$\{\{ secrets\.DATABASE_URL \}\}/);
assertJobContains('migration-release-handoff', /pnpm prisma:migrate:deploy/);
assert.equal(
  workflow.split(/\r?\n/).filter((line) => line.includes('DATABASE_URL')).length,
  1,
  'DATABASE_URL must only be referenced by the release migration job',
);
assert.doesNotMatch(workflow, /prisma migrate reset/i, 'CI must never reset a data-bearing database');

console.log('CI workflow validation passed for master release flow, Node 24, quality gates, and one-shot migrations.');
