# Food Recipes backend

Last reviewed: 2026-09-14

This directory is the backend package. It owns the only backend
`node_modules`, lockfile, Prisma project, NestJS application, tests, and Docker
image definition. The repository root intentionally does not own a Node package
or application scripts.

## Structure

- `src/` contains the NestJS API source.
- `prisma/` contains the Prisma schema, migrations, legacy evidence, and demo
  seed.
- `test/` contains backend static and E2E tests.
- `infrastructure/` contains backend-only Compose configuration.
- `package.json`, `pnpm-workspace.yaml`, and `pnpm-lock.yaml` are the backend
  package-manager entry points. The workspace file only defines the dependency
  build allowlist; it does not define nested packages.

## Local commands

```powershell
corepack pnpm@11.18.0 install
corepack pnpm@11.18.0 dev
corepack pnpm@11.18.0 infra:up
corepack pnpm@11.18.0 check
corepack pnpm@11.18.0 build
corepack pnpm@11.18.0 test:e2e
```

Run the API Compose stack from this directory:

```powershell
docker compose --project-directory . -f infrastructure/docker/docker-compose.dev.yml up --build
```

The `infra:up` shortcut builds and starts PostgreSQL,
the one-shot migration service, and the API in Compose dependency order. The API
image uses this directory as its build context and `Dockerfile`. Keep
`JWT_SECRET` in the local environment only; never
commit `.env` or database credentials.

The package requires Node 24 or newer according to `package.json`; CI uses the
Node 24 line. Prisma generation, migration validation, and application tests
are backend-local operations because the repository intentionally has no root
pnpm workspace.
