import assert from 'node:assert/strict';
import {
  findDependencyDowngrades,
  parseComparableVersion,
} from '../../../.github/scripts/check-dependency-downgrades.mjs';

const manifest = ({ dependencies = {}, devDependencies = {}, peerDependencies = {}, optionalDependencies = {} } = {}) => ({
  dependencies,
  devDependencies,
  peerDependencies,
  optionalDependencies,
});

assert.deepEqual(parseComparableVersion('^29.1.1'), [29, 1, 1]);
assert.deepEqual(parseComparableVersion('~5.0.0'), [5, 0, 0]);
assert.deepEqual(parseComparableVersion('9.1.7'), [9, 1, 7]);
assert.equal(parseComparableVersion('workspace:*'), null);
assert.equal(parseComparableVersion('file:../local-package'), null);
assert.equal(parseComparableVersion('>=1.0.0 <2.0.0'), null);

assert.deepEqual(
  findDependencyDowngrades(
    manifest({ dependencies: { react: '^19.2.7' } }),
    manifest({ dependencies: { react: '^19.2.7' } }),
  ),
  [],
  'equal dependency versions must pass',
);

assert.deepEqual(
  findDependencyDowngrades(
    manifest({ dependencies: { react: '^19.2.7' } }),
    manifest({ dependencies: { react: '^19.3.0' } }),
  ),
  [],
  'dependency upgrades must pass',
);

assert.deepEqual(
  findDependencyDowngrades(
    manifest({ devDependencies: { jsdom: '29.1.1' } }),
    manifest({ devDependencies: { jsdom: '24.1.3' } }),
  ),
  [
    {
      section: 'devDependencies',
      name: 'jsdom',
      from: '29.1.1',
      to: '24.1.3',
    },
  ],
  'dependency downgrades must be reported',
);

assert.deepEqual(
  findDependencyDowngrades(
    manifest({ dependencies: { obsolete: '^3.0.0' } }),
    manifest(),
  ),
  [],
  'dependency removal is not a downgrade',
);

assert.deepEqual(
  findDependencyDowngrades(
    manifest({ dependencies: { internal: 'workspace:*' } }),
    manifest({ dependencies: { internal: 'workspace:^' } }),
  ),
  [],
  'unsupported non-semver specifiers must be ignored rather than guessed',
);

assert.deepEqual(
  findDependencyDowngrades(
    manifest({ peerDependencies: { zod: '^4.4.3' }, optionalDependencies: { sharp: '~0.34.0' } }),
    manifest({ peerDependencies: { zod: '^4.3.0' }, optionalDependencies: { sharp: '~0.33.5' } }),
  ),
  [
    {
      section: 'peerDependencies',
      name: 'zod',
      from: '^4.4.3',
      to: '^4.3.0',
    },
    {
      section: 'optionalDependencies',
      name: 'sharp',
      from: '~0.34.0',
      to: '~0.33.5',
    },
  ],
  'peer and optional dependency downgrades must be checked',
);

console.log('Dependency downgrade validation passed.');
