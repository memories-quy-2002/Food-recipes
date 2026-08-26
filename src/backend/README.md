# Food Recipes backend

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
corepack pnpm dev
corepack pnpm check
corepack pnpm build
corepack pnpm test:e2e
```

Run the API Compose stack from this directory:

```powershell
docker compose --project-directory . -f infrastructure/docker/docker-compose.dev.yml up --build
```

The API image uses this directory as its build context and `Dockerfile`. Keep
`JWT_SECRET` in the local environment only; never
commit `.env` or database credentials.
