import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '../../..');

const [dependencyWorkflow, dependabotConfig, qualityWorkflow] = await Promise.all([
  readFile(path.join(repositoryRoot, '.github/workflows/dependency-security.yml'), 'utf8'),
  readFile(path.join(repositoryRoot, '.github/dependabot.yml'), 'utf8'),
  readFile(path.join(repositoryRoot, '.github/workflows/quality-gates.yml'), 'utf8'),
]);

assert.match(
  dependencyWorkflow,
  /^  dependency-downgrade:\r?$/m,
  'dependency security workflow must define a dependency-downgrade job',
);
assert.match(
  dependencyWorkflow,
  /actions\/checkout@v4[\s\S]*fetch-depth:\s*0/,
  'dependency downgrade guard must fetch full Git history so the PR base SHA is available',
);
assert.match(
  dependencyWorkflow,
  /actions\/setup-node@v4[\s\S]*node-version:\s*24/,
  'dependency downgrade guard must run on Node 24',
);
assert.match(
  dependencyWorkflow,
  /BASE_SHA:\s*\$\{\{ github\.event\.pull_request\.base\.sha \}\}/,
  'dependency downgrade guard must compare against the exact pull request base SHA',
);
assert.match(
  dependencyWorkflow,
  /node \.github\/scripts\/check-dependency-downgrades\.mjs/,
  'dependency security workflow must run the downgrade guard script',
);
assert.doesNotMatch(
  dependencyWorkflow,
  /contents:\s*write/i,
  'dependency security workflow must remain read-only',
);

assert.match(
  qualityWorkflow,
  /node src\/backend\/test\/dependency-downgrade\.validation\.mjs/,
  'quality gates must run dependency downgrade validation',
);
assert.match(
  qualityWorkflow,
  /node src\/backend\/test\/dependabot-safety\.validation\.mjs/,
  'quality gates must run Dependabot safety validation',
);

const npmEntries = dependabotConfig.match(/^- package-ecosystem: "npm"$|^  - package-ecosystem: "npm"$/gm) ?? [];
assert.equal(npmEntries.length, 1, 'Dependabot must use exactly one npm update entry');

const npmStart = dependabotConfig.indexOf('  - package-ecosystem: "npm"');
const actionsStart = dependabotConfig.indexOf('  - package-ecosystem: "github-actions"');
assert.ok(npmStart >= 0, 'npm Dependabot entry must exist');
assert.ok(actionsStart > npmStart, 'GitHub Actions entry must follow npm entry');

const npmBlock = dependabotConfig.slice(npmStart, actionsStart);
const actionsBlock = dependabotConfig.slice(actionsStart);

assert.match(
  npmBlock,
  /directories:\r?\n      - "\/src\/frontend"\r?\n      - "\/src\/backend"/,
  'npm updates must consolidate frontend and backend manifests',
);
assert.match(
  npmBlock,
  /open-pull-requests-limit: 4/,
  'npm PR limit must temporarily reserve room for the three existing NestJS 12 PRs plus one routine group',
);
assert.match(
  npmBlock,
  /versioning-strategy: "increase-if-necessary"/,
  'npm updates must avoid unnecessary manifest churn',
);
assert.match(
  npmBlock,
  /cooldown:\r?\n      semver-patch-days: 3\r?\n      semver-minor-days: 7\r?\n      semver-major-days: 30/,
  'npm updates must use staged patch/minor/major cooldowns',
);

assert.match(
  npmBlock,
  /dependency-name: "\*"\r?\n        update-types:\r?\n          - "version-update:semver-patch"\r?\n          - "version-update:semver-minor"/,
  'routine npm version updates must be limited to patch and minor releases',
);
for (const dependency of ['@nestjs/config', '@nestjs/jwt', '@nestjs/passport']) {
  assert.match(
    npmBlock,
    new RegExp(`dependency-name: "${dependency.replace('/', '\\/')}"`),
    `${dependency} must remain explicitly allowed while its NestJS 12 PR stays open`,
  );
}

assert.match(
  npmBlock,
  /routine-npm-updates:\r?\n        applies-to: "version-updates"[\s\S]*?patterns:\r?\n          - "\*"[\s\S]*?exclude-patterns:\r?\n          - "class-validator"[\s\S]*?update-types:\r?\n          - "patch"\r?\n          - "minor"/,
  'routine npm updates must be grouped while class-validator remains separately reviewed',
);
assert.match(
  npmBlock,
  /security-npm-updates:\r?\n        applies-to: "security-updates"\r?\n        patterns:\r?\n          - "\*"/,
  'npm security updates must be grouped separately from routine version updates',
);

assert.match(
  actionsBlock,
  /open-pull-requests-limit: 1/,
  'GitHub Actions must allow only one update PR at a time',
);
assert.match(
  actionsBlock,
  /groups:\r?\n      github-actions:\r?\n        patterns:\r?\n          - "\*"/,
  'GitHub Actions updates must be grouped into one PR',
);

assert.doesNotMatch(
  dependabotConfig,
  /^\s+- "dependabot"\s*$/m,
  'Dependabot config must not reference the missing dependabot label',
);

console.log('Dependabot safety validation passed.');
