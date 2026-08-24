# Repository Guidelines

## Project Structure

This repository contains two independent packages rather than a root pnpm workspace:

- `src/frontend/`: React, Vite, React Router, TanStack Query, shared UI, feature modules, and Playwright journeys in `e2e/`.
- `src/backend/`: NestJS REST API, Prisma schema and migrations in `prisma/`, unit tests beside modules, and API tests in `test/`.
- `docs/`: design notes and implementation specifications.

Keep new code in the existing feature-oriented directory. Frontend imports may use the `@` alias for `src/frontend`.

## Development and Verification

Run each package from its own directory:

```powershell
cd src/frontend; pnpm dev       # Start Vite
pnpm check                       # Lint, typecheck, and unit tests
pnpm build                       # Production frontend build
pnpm test:e2e:ci                 # Playwright user journeys
```

```powershell
cd src/backend; corepack pnpm@11.18.0 dev
corepack pnpm@11.18.0 check     # Typecheck and Jest tests
corepack pnpm@11.18.0 build
corepack pnpm@11.18.0 test:e2e
corepack pnpm@11.18.0 prisma:validate
```

Use Docker Compose from `src/backend` when a local PostgreSQL instance is needed. Never commit `.env` files, credentials, tokens, or production URLs.

## Coding and Architecture Conventions

Use TypeScript for new code where practical. Match surrounding formatting: frontend files commonly use tabs, while NestJS files use two-space indentation. React components and classes use `PascalCase`; hooks use `useName`; tests use `.test.*` or `.spec.*`.

Keep components focused, remote state in TanStack Query, and form/UI state local. Keep NestJS controllers thin, put business rules in services, and enforce ownership server-side for user resources. Prefer existing APIs, UI primitives, and styles over new dependencies or broad refactors.

## Testing Guidelines

Test observable behavior and business rules. Add focused unit/component tests for changed logic, backend tests for authorization and validation, and Playwright coverage for important user journeys. Preserve keyboard accessibility, loading, empty, error, mobile, and desktop states.

## Commits and Pull Requests

Use Conventional Commits with a narrow scope, for example `feat(planning): add weekly planner` or `fix(recipe): preserve filter URL`. Keep commits small and unrelated changes separate. Pull requests should explain the behavior change, list verification commands, note migrations or configuration changes, and include before/after screenshots for UI work.
