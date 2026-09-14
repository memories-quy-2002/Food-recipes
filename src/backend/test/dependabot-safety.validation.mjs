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

const assertGroup = (groupName, dependencyType) => {
  const pattern = new RegExp(
    `^      ${groupName}:\\r?\\n` +
      `[\\s\\S]*?^        dependency-type: "${dependencyType}"\\r?$` +
      `[\\s\\S]*?^        patterns:\\r?\\n          - "\\*"\\r?$` +
      `[\\s\\S]*?^        update-types:\\r?\\n          - "minor"\\r?\\n          - "patch"`,
    'm',
  );
  assert.match(
    dependabotConfig,
    pattern,
    `${groupName} must group only ${dependencyType} minor/patch updates`,
  );
};

assertGroup('frontend-runtime', 'production');
assertGroup('frontend-dev', 'development');
assertGroup('backend-runtime', 'production');
assertGroup('backend-dev', 'development');

const backendRuntimeStart = dependabotConfig.indexOf('      backend-runtime:');
const backendDevStart = dependabotConfig.indexOf('      backend-dev:', backendRuntimeStart);
assert.ok(backendRuntimeStart >= 0, 'backend-runtime group must exist');
assert.ok(backendDevStart > backendRuntimeStart, 'backend-dev group must follow backend-runtime');
const backendRuntimeBlock = dependabotConfig.slice(backendRuntimeStart, backendDevStart);
assert.match(
  backendRuntimeBlock,
  /exclude-patterns:\r?\n          - "class-validator"/,
  'backend runtime group must keep class-validator as an individually reviewed dependency',
);

assert.doesNotMatch(
  dependabotConfig,
  /^\s+- "dependabot"\s*$/m,
  'Dependabot config must not reference the missing dependabot label',
);

console.log('Dependabot safety validation passed.');
