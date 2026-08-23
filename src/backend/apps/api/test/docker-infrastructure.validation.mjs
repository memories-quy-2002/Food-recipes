import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const apiTestDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(apiTestDirectory, '../../../../..');

const files = {
  dockerfile: path.join(repositoryRoot, 'src/backend/apps/api/Dockerfile'),
  apiDockerignore: path.join(repositoryRoot, 'src/backend/apps/api/.dockerignore'),
  rootDockerignore: path.join(repositoryRoot, '.dockerignore'),
  compose: path.join(repositoryRoot, 'infrastructure/docker/docker-compose.yml'),
  composeDev: path.join(repositoryRoot, 'infrastructure/docker/docker-compose.dev.yml'),
};

const contents = Object.fromEntries(
  await Promise.all(
    Object.entries(files).map(async ([name, filePath]) => [name, await readFile(filePath, 'utf8')]),
  ),
);

const countMatches = (value, pattern) => value.match(pattern)?.length ?? 0;

assert.match(contents.dockerfile, /^FROM node:24(?:[-@].*)? AS /m, 'Dockerfile must use a Node 24 multi-stage base');
assert.ok(countMatches(contents.dockerfile, /^FROM /gm) >= 3, 'Dockerfile must contain multiple build stages');
assert.match(contents.dockerfile, /pnpm install --frozen-lockfile/, 'dependencies must install from the frozen workspace lockfile');
assert.match(contents.dockerfile, /COPY .*pnpm-lock\.yaml/, 'the root pnpm lockfile must be in the build context');
assert.match(contents.dockerfile, /prisma generate/, 'the image build must generate Prisma Client');
assert.match(contents.dockerfile, /pnpm --filter @food-recipes\/api run build/, 'the API must be built in the image');
assert.match(contents.dockerfile, /USER node/, 'the runtime image must run as a non-root user');
assert.match(contents.dockerfile, /CMD \["node",\s*"dist\/main\.js"\]/, 'the runtime must execute dist/main.js');

for (const [name, dockerignore] of [
  ['API .dockerignore', contents.apiDockerignore],
  ['root .dockerignore', contents.rootDockerignore],
]) {
  assert.match(dockerignore, /node_modules/, `${name} must exclude node_modules`);
  assert.match(dockerignore, /dist/, `${name} must exclude build output`);
  assert.match(dockerignore, /\.env/, `${name} must exclude environment files`);
}
assert.doesNotMatch(contents.apiDockerignore, /(?:^|\n)prisma(?:\/|\s|$)/, 'API .dockerignore must keep Prisma files available');

assert.match(contents.compose, /postgres:/, 'production-like Compose must define PostgreSQL');
assert.match(contents.compose, /healthcheck:/, 'PostgreSQL must have a healthcheck');
assert.match(contents.compose, /pg_isready/, 'PostgreSQL healthcheck must use pg_isready');
assert.match(contents.compose, /migrate:/, 'production-like Compose must define a migration service');
assert.match(contents.compose, /prisma migrate deploy|prisma",\s*"migrate",\s*"deploy/, 'migration service must use prisma migrate deploy');
assert.doesNotMatch(contents.compose, /migrate reset/, 'migration config must never reset the database');
assert.match(contents.compose, /condition:\s*service_healthy/, 'database dependencies must wait for a healthy PostgreSQL service');
assert.match(contents.compose, /condition:\s*service_completed_successfully/, 'API must wait for successful migrations');
assert.match(contents.compose, /internal:\s*true/, 'production-like Compose must use an internal network');
assert.match(contents.compose, /DATABASE_URL:\s*\$\{[^}]+\}/, 'API database URL must be configurable through an environment placeholder');
assert.match(contents.compose, /JWT_SECRET:\s*\$\{[^}]+\}/, 'API JWT secret must be configurable through an environment placeholder');
assert.doesNotMatch(contents.compose, /^\s+ports:/m, 'production-like Compose should keep API ports internal');

assert.match(contents.composeDev, /ports:/, 'development Compose must publish useful local ports');
assert.match(contents.composeDev, /127\.0\.0\.1:/, 'development ports must bind to localhost');
assert.match(contents.composeDev, /src\/backend\/apps\/api\/src:/, 'development Compose must mount API source');
assert.match(contents.composeDev, /condition:\s*service_healthy/, 'development migration must wait for healthy PostgreSQL');
assert.match(contents.composeDev, /condition:\s*service_completed_successfully/, 'development API must wait for successful migrations');

console.log('Task 15 Docker infrastructure static validation passed.');
