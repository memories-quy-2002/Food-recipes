import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const apiDirectory = path.resolve(testDirectory, '..');
const repositoryRoot = path.resolve(apiDirectory, '../..');

const files = {
  buildConfig: path.join(apiDirectory, 'tsconfig.build.json'),
  envExample: path.join(apiDirectory, '.env.example'),
  prismaConfig: path.join(apiDirectory, 'prisma.config.ts'),
  prismaService: path.join(apiDirectory, 'src/infrastructure/prisma/prisma.service.ts'),
};

const contents = Object.fromEntries(
  await Promise.all(
    Object.entries(files).map(async ([name, filePath]) => [
      name,
      await readFile(filePath, 'utf8'),
    ]),
  ),
);

const buildConfig = JSON.parse(contents.buildConfig);
assert.equal(buildConfig.compilerOptions.rootDir, 'src');
assert.equal(buildConfig.compilerOptions.outDir, 'dist');
assert.deepEqual(buildConfig.include, ['src/**/*.ts']);
assert.doesNotMatch(contents.buildConfig, /jest\.config|prisma\.config/);

assert.match(contents.prismaConfig, /DATABASE_URL/);
assert.match(contents.prismaConfig, /127\.0\.0\.1:1/);
assert.match(contents.prismaConfig, /resolveDatabaseUrl/);
assert.match(contents.envExample, /^JWT_SECRET=.*(?:replace-with|change-me|generate)/m);
assert.match(contents.prismaService, /OnModuleDestroy/);
assert.doesNotMatch(contents.prismaService, /OnModuleInit|onModuleInit|\$connect\(\)/);

assert.ok(repositoryRoot, 'repository root must resolve');
console.log('Foundation static validation passed: build scope, offline Prisma config, placeholder JWT example, and lazy Prisma lifecycle were verified.');
