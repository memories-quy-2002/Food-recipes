import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const apiTestDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(apiTestDirectory, '../../../../..');
const apiDirectory = path.resolve(apiTestDirectory, '..');
const backendRoot = path.resolve(apiDirectory, '../..');

const files = {
  dockerfile: path.join(apiDirectory, 'Dockerfile'),
  apiDockerignore: path.join(backendRoot, '.dockerignore'),
  compose: path.join(backendRoot, 'infrastructure/docker/docker-compose.yml'),
  composeDev: path.join(backendRoot, 'infrastructure/docker/docker-compose.dev.yml'),
  kong: path.join(backendRoot, 'infrastructure/kong/kong.yml'),
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
const composeKong = serviceSection(contents.compose, 'kong');

assert.match(contents.dockerfile, /^FROM node:24(?:[-@].*)? AS /m, 'Dockerfile must use a Node 24 multi-stage base');
assert.ok(countMatches(contents.dockerfile, /^FROM /gm) >= 3, 'Dockerfile must contain multiple build stages');
assert.match(contents.dockerfile, /pnpm install --frozen-lockfile/, 'dependencies must install from the frozen API lockfile');
assert.match(contents.dockerfile, /COPY package\.json pnpm-lock\.yaml pnpm-workspace\.yaml/, 'the backend workspace lockfile must be in the build context');
assert.match(contents.dockerfile, /COPY apps\/api\/package\.json apps\/api\/package\.json/, 'the API package must be in the backend build context');
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
assert.match(contents.compose, /context:\s*\.\s*\r?\n\s+dockerfile:\s+apps\/api\/Dockerfile/, 'production-like Compose must build from the backend root context');
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
assert.match(contents.compose, /expose:\s*\n\s+-\s+"3000"/, 'production-like API must expose internal port 3000');
assert.doesNotMatch(contents.compose, /\bAPI_PORT\b/, 'production-like Compose must not use API_PORT for the internal API port');
assert.doesNotMatch(composeApi, /^\s+ports:/m, 'production-like Compose should keep API ports internal');

assert.match(contents.compose, /^  kong:\r?\n/m, 'production-like Compose must define Kong');
assert.match(composeKong, /KONG_DATABASE:\s*["']?off["']?/i, 'Kong must run in DB-less mode');
assert.match(composeKong, /KONG_DECLARATIVE_CONFIG:\s*\/etc\/kong\/kong\.yml/, 'Kong must load the declarative config');
assert.match(composeKong, /(?:\.\/)?infrastructure\/kong\/kong\.yml:\/etc\/kong\/kong\.yml:ro/, 'Kong config must be mounted read-only');
assert.match(composeKong, /ports:\s*\n\s+-\s+"8000:8000"/, 'Kong must publish gateway port 8000');
assert.match(composeKong, /depends_on:\s*\n\s+api:\s*\n\s+condition:\s*service_healthy/, 'Kong must wait for a healthy API');
assert.match(composeApi, /healthcheck:\s*[\s\S]*?health\/live/, 'API must expose a healthcheck for Kong readiness');

assert.match(contents.kong, /^_format_version:\s*["']3\.0["']\s*$/m, 'Kong config must use declarative format 3.0');
assert.match(contents.kong, /^_transform:\s*true\s*$/m, 'Kong declarative transformations must be enabled');
assert.match(contents.kong, /name:\s+api\s*\n\s+url:\s+http:\/\/api:3000/, 'Kong must target the internal API service');
for (const routePath of ['/api', '/docs', '/docs-json']) {
  assert.match(contents.kong, new RegExp(`^\\s+- ${routePath.replace('/', '\\/')}\\s*$`, 'm'), `Kong must route ${routePath}`);
}
assert.equal(countMatches(contents.kong, /^\s+strip_path:\s+false\s*$/gm), 3, 'Kong routes must preserve upstream paths');
assert.match(contents.kong, /name:\s+correlation-id[\s\S]*?header_name:\s+X-Request-ID[\s\S]*?generator:\s+uuid[\s\S]*?echo_downstream:\s+true/, 'Kong must echo generated X-Request-ID values');
assert.match(contents.kong, /name:\s+rate-limiting[\s\S]*?minute:\s+60[\s\S]*?policy:\s+local[\s\S]*?limit_by:\s+ip[\s\S]*?error_code:\s+429/, 'Kong must apply explicit local IP rate limiting');
assert.match(contents.kong, /error_message:\s+API rate limit exceeded;/, 'Kong must document its rate-limit response policy');
const pluginSection = contents.kong.slice(contents.kong.indexOf('\nplugins:'));
const pluginNames = [...pluginSection.matchAll(/^\s+- name:\s+([a-z0-9-]+)\s*$/gm)].map(([, name]) => name);
assert.deepEqual(pluginNames, ['correlation-id', 'rate-limiting'], 'Kong must not install an auth plugin');

assert.match(contents.composeDev, /ports:/, 'development Compose must publish useful local ports');
assert.match(contents.composeDev, /context:\s*\.\s*\r?\n\s+dockerfile:\s+apps\/api\/Dockerfile/, 'development Compose must build from the backend root context');
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
assert.match(contents.composeDev, /(?:\.\/)?apps\/api\/src:/, 'development Compose must mount API source');
assert.match(contents.composeDev, /condition:\s*service_healthy/, 'development migration must wait for healthy PostgreSQL');
assert.match(contents.composeDev, /condition:\s*service_completed_successfully/, 'development API must wait for successful migrations');
assert.doesNotMatch(contents.composeDev, /^\s+kong:/m, 'development Compose must remain independent from Kong');
assert.doesNotMatch(contents.composeDev, /KONG_DATABASE|KONG_DECLARATIVE_CONFIG/, 'development Compose must not require Kong configuration');

console.log('Task 16 Kong and Docker infrastructure static validation passed.');
