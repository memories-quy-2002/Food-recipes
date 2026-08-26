import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const apiTestDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(apiTestDirectory, '../../..');
const apiDirectory = path.resolve(apiTestDirectory, '..');
const backendRoot = apiDirectory;

const files = {
  dockerfile: path.join(apiDirectory, 'Dockerfile'),
  apiDockerignore: path.join(backendRoot, '.dockerignore'),
  compose: path.join(backendRoot, 'infrastructure/docker/docker-compose.yml'),
  composeDev: path.join(backendRoot, 'infrastructure/docker/docker-compose.dev.yml'),
};

const contents = Object.fromEntries(
  await Promise.all(
    Object.entries(files).map(async ([name, filePath]) => [name, await readFile(filePath, 'utf8')]),
  ),
);

const countMatches = (value, pattern) => value.match(pattern)?.length ?? 0;
const serviceSection = (compose, serviceName) => {
  const match = compose.match(
    new RegExp(`^  ${serviceName}:\\r?\\n(?:(?!^  \\S).)*(?=^  \\S|$)`, 'ms'),
  );
  assert.ok(match, `Compose must define the ${serviceName} service`);
  return match[0];
};

const composeApi = serviceSection(contents.compose, 'api');

assert.match(contents.dockerfile, /^FROM node:24(?:[-@].*)? AS /m, 'Dockerfile must use a Node 24 multi-stage base');
assert.ok(countMatches(contents.dockerfile, /^FROM /gm) >= 3, 'Dockerfile must contain multiple build stages');
assert.match(contents.dockerfile, /pnpm install --frozen-lockfile/, 'dependencies must install from the frozen API lockfile');
assert.match(contents.dockerfile, /COPY package\.json pnpm-lock\.yaml \.npmrc pnpm-workspace\.yaml/, 'the backend package manifest, lockfile, and build policy must be in the build context');
assert.match(contents.dockerfile, /prisma generate/, 'the image build must generate Prisma Client');
assert.match(contents.dockerfile, /pnpm run build/, 'the API must be built in the image');
assert.match(contents.dockerfile, /USER node/, 'the runtime image must run as a non-root user');
assert.match(contents.dockerfile, /^EXPOSE 3000$/m, 'the Nest container contract must expose port 3000');
assert.match(contents.dockerfile, /CMD \["node",\s*"dist\/main\.js"\]/, 'the runtime must execute dist/main.js');

assert.match(contents.apiDockerignore, /node_modules/, 'API .dockerignore must exclude node_modules');
assert.match(contents.apiDockerignore, /dist/, 'API .dockerignore must exclude build output');
assert.match(contents.apiDockerignore, /\.env/, 'API .dockerignore must exclude environment files');
assert.doesNotMatch(contents.apiDockerignore, /(?:^|\n)prisma(?:\/|\s|$)/, 'API .dockerignore must keep Prisma files available');

assert.match(contents.compose, /postgres:/, 'production-like Compose must define PostgreSQL');
assert.match(contents.compose, /context:\s*\.\s*\r?\n\s+dockerfile:\s+Dockerfile/, 'production-like Compose must build from the backend project directory');
assert.match(contents.compose, /healthcheck:/, 'PostgreSQL must have a healthcheck');
assert.match(contents.compose, /pg_isready/, 'PostgreSQL healthcheck must use pg_isready');
assert.match(contents.compose, /migrate:/, 'production-like Compose must define a migration service');
assert.match(contents.compose, /prisma migrate deploy|prisma",\s*"migrate",\s*"deploy/, 'migration service must use prisma migrate deploy');
assert.doesNotMatch(contents.compose, /migrate reset/, 'migration config must never reset the database');
assert.match(contents.compose, /condition:\s*service_healthy/, 'database dependencies must wait for a healthy PostgreSQL service');
assert.match(contents.compose, /condition:\s*service_completed_successfully/, 'API must wait for successful migrations');
assert.match(contents.compose, /internal:\s*true/, 'production-like Compose must use an internal network');
assert.match(contents.compose, /DATABASE_URL:\s*\$\{[^}]+\}/, 'API database URL must be configurable through an environment placeholder');
assert.match(contents.compose, /JWT_SECRET:\s*["']?\$\{[^}]+\}["']?/, 'API JWT secret must be configurable through an environment placeholder');
assert.match(
  composeApi,
  /JWT_SECRET:\s*["']?\$\{JWT_SECRET:\?[^}]+\}["']?/,
  'production-like Compose must require JWT_SECRET without committing a secret',
);
assert.doesNotMatch(composeApi, /replace-with|change-me|generate-a-random-secret/i);
assert.match(contents.compose, /^\s+PORT:\s*3000\s*$/m, 'production-like API must listen on the internal container port 3000');
assert.match(contents.compose, /ports:\s*\n\s+-\s+"\$\{API_PORT:-3000\}:3000"/, 'production-like API must publish the configurable host port');
assert.match(composeApi, /^\s+ports:/m, 'production-like Compose must publish the API directly');
assert.match(composeApi, /healthcheck:\s*[\s\S]*?health\/live/, 'API must expose a direct healthcheck');

assert.match(contents.composeDev, /ports:/, 'development Compose must publish useful local ports');
assert.match(contents.composeDev, /context:\s*\.\s*\r?\n\s+dockerfile:\s+Dockerfile/, 'development Compose must build from the backend project directory');
assert.match(contents.composeDev, /127\.0\.0\.1:/, 'development ports must bind to localhost');
assert.match(contents.composeDev, /^\s+PORT:\s*3000\s*$/m, 'development API must listen on the internal container port 3000');
assert.match(contents.composeDev, /127\.0\.0\.1:\$\{API_PORT:-3000\}:3000/, 'development API_PORT must control only the host-side published port');
const composeDevApi = serviceSection(contents.composeDev, 'api');
assert.match(
  composeDevApi,
  /JWT_SECRET:\s*["']?\$\{JWT_SECRET:\?[^}]+\}["']?/,
  'development Compose must require JWT_SECRET without committing a secret',
);
assert.doesNotMatch(composeDevApi, /replace-with|change-me|generate-a-random-secret/i);
assert.doesNotMatch(contents.composeDev, /API_HOST_PORT/, 'development Compose must use API_PORT as the host-side port contract');
assert.match(contents.composeDev, /(?:\.\/)?src:/, 'development Compose must mount API source');
assert.doesNotMatch(contents.composeDev, /^\s+internal:\s+true\s*$/m, 'development Compose must publish API and PostgreSQL ports to localhost');
assert.match(contents.composeDev, /condition:\s*service_healthy/, 'development migration must wait for healthy PostgreSQL');
assert.match(contents.composeDev, /condition:\s*service_completed_successfully/, 'development API must wait for successful migrations');
console.log('Direct Nest API and Docker infrastructure static validation passed.');
