# Food Recipes backend

This directory is the backend pnpm workspace. The repository root intentionally
does not own a Node package or application scripts.

## Structure

- `apps/api/` contains the NestJS API package, Prisma schema, migrations, tests,
  and its Dockerfile.
- `infrastructure/` contains backend-only Compose and Kong configuration.
- `package.json`, `pnpm-workspace.yaml`, and `pnpm-lock.yaml` belong to this
  workspace and are the only backend package-manager entry points.

## Local commands

```powershell
corepack pnpm install
corepack pnpm dev
corepack pnpm check
corepack pnpm build
corepack pnpm test:e2e
```

Run the API Compose stack from this directory:

```powershell
docker compose --project-directory . -f infrastructure/docker/docker-compose.dev.yml up --build
```

The API image uses this directory as its build context and
`apps/api/Dockerfile`. Keep `JWT_SECRET` in the local environment only; never
commit `.env` or database credentials.
