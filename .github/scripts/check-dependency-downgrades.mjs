import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEPENDENCY_SECTIONS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

const MANIFEST_PATHS = [
  'src/frontend/package.json',
  'src/backend/package.json',
];

export function parseComparableVersion(specifier) {
  if (typeof specifier !== 'string') return null;

  const match = specifier.trim().match(/^(?:\^|~|=)?v?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;

  return match.slice(1).map(Number);
}

function compareVersions(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

export function findDependencyDowngrades(baseManifest, currentManifest) {
  const downgrades = [];

  for (const section of DEPENDENCY_SECTIONS) {
    const baseDependencies = baseManifest?.[section] ?? {};
    const currentDependencies = currentManifest?.[section] ?? {};

    for (const [name, baseSpecifier] of Object.entries(baseDependencies)) {
      const currentSpecifier = currentDependencies[name];
      if (typeof currentSpecifier !== 'string') continue;

      const baseVersion = parseComparableVersion(baseSpecifier);
      const currentVersion = parseComparableVersion(currentSpecifier);
      if (!baseVersion || !currentVersion) continue;

      if (compareVersions(currentVersion, baseVersion) < 0) {
        downgrades.push({
          section,
          name,
          from: baseSpecifier,
          to: currentSpecifier,
        });
      }
    }
  }

  return downgrades;
}

async function run() {
  const baseSha = process.env.BASE_SHA;
  if (!baseSha) {
    throw new Error('BASE_SHA is required to compare dependency manifests against the pull request base commit.');
  }

  const allDowngrades = [];

  for (const manifestPath of MANIFEST_PATHS) {
    const baseManifest = JSON.parse(
      execFileSync('git', ['show', `${baseSha}:${manifestPath}`], { encoding: 'utf8' }),
    );
    const currentManifest = JSON.parse(await readFile(manifestPath, 'utf8'));

    for (const downgrade of findDependencyDowngrades(baseManifest, currentManifest)) {
      allDowngrades.push({ manifestPath, ...downgrade });
    }
  }

  if (allDowngrades.length > 0) {
    console.error('Dependency downgrade detected relative to the pull request base commit:');
    for (const downgrade of allDowngrades) {
      console.error(
        `- ${downgrade.manifestPath} [${downgrade.section}] ${downgrade.name}: ${downgrade.from} -> ${downgrade.to}`,
      );
    }
    process.exitCode = 1;
    return;
  }

  console.log('Dependency downgrade guard passed: no direct dependency versions moved backwards.');
}

const isMainModule =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
