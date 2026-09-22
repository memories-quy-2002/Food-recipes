# Repository Guidelines

## Required context before every task

Before planning, editing, or answering a repository task:

1. Read [docs/README.md](docs/README.md) and [Wiki/index.md](Wiki/index.md).
2. Follow those indexes to the current guide and Wiki pages relevant to the
   feature, API, entity, workflow, or architecture being changed. Find and read
   those pages before deciding how to implement the task.
3. Check the relevant code, schema, tests, and configuration. They are the
   executable source of truth if they disagree with documentation; update the
   affected maintained docs when the task changes behavior or reveals drift.
4. Consult `docs/archive/` only when historical context is needed. Archived
   plans are not current implementation instructions.

Do not skip the Wiki/docs discovery step for coding tasks. Do not read every
Wiki or archive page when the indexes and relevant pages answer the task.

## Project Structure

This repository contains two independent packages rather than a root pnpm workspace:

- `src/frontend/`: React, Vite, React Router, TanStack Query, shared UI, feature modules, and Playwright journeys in `e2e/`.
- `src/backend/`: NestJS REST API, Prisma schema and migrations in `prisma/`, unit tests beside modules, and API tests in `test/`.
- `docs/`: current developer guides, CI/CD operations, planning workflows, and historical plans in `archive/`.
- `Wiki/`: maintained product, architecture, domain, and decision knowledge.

Keep new code in the existing feature-oriented directory. Frontend imports may use the `@` alias for `src/frontend`.

## Documentation and planning

- Use [docs/README.md](docs/README.md) and [Wiki/index.md](Wiki/index.md) as the discovery indexes.
- Use [docs/ci-cd.md](docs/ci-cd.md) for checked-in CI, deployment, and production-operation boundaries.
- Use `docs/ai-prompts/README.md` to select a task workflow. A prompt does not expand the user's requested scope.
- Use `docs/bmad/README.md` for multi-feature work, cross-package changes, API or schema changes, and unresolved product scope. Skip its artifacts for small fixes and documentation-only edits.
- Keep current guides under `docs/`. Move completed or superseded plans to `docs/archive/`; archived plans are historical references, not current instructions.
- Update the Wiki when implementation changes a durable business rule, API contract, data model, security boundary, or architecture decision. Record approved decisions only; do not turn assumptions into ADRs.

## Development and Verification

Run each package from its own directory:

~~~powershell
cd src/frontend
pnpm dev
pnpm check
pnpm build
pnpm test:e2e:quality
pnpm test:e2e:ci
~~~

~~~powershell
cd src/backend
corepack pnpm@11.18.0 dev
corepack pnpm@11.18.0 check
corepack pnpm@11.18.0 build
corepack pnpm@11.18.0 test:e2e
corepack pnpm@11.18.0 prisma:validate
~~~

Use Docker Compose from `src/backend` when a local PostgreSQL instance is needed. Never commit `.env` files, credentials, tokens, or production URLs.

## Coding and Architecture Conventions

Use TypeScript for new code where practical. Match surrounding formatting: frontend files commonly use tabs, while NestJS files use two-space indentation. React components and classes use `PascalCase`; hooks use `useName`; tests use `.test.*` or `.spec.*`.

Keep components focused, remote state in TanStack Query, and form/UI state local. Keep NestJS controllers thin, put business rules in services, and enforce ownership server-side for user resources. Prefer existing APIs, UI primitives, and styles over new dependencies or broad refactors.
- Product scope is one personal kitchen per signed-in account. Do not
  reintroduce household/group kitchen features. Existing household tables and
  records are legacy data; do not delete or reassign them without an approved
  backup and retention plan.


## Testing Guidelines

Test observable behavior and business rules. Add focused unit/component tests for changed logic, backend tests for authorization and validation, and Playwright coverage for important user journeys. Preserve keyboard accessibility, loading, empty, error, mobile, and desktop states.

## Commits and Pull Requests

Use Conventional Commits with a narrow scope, for example `feat(planning): add weekly planner` or `fix(recipe): preserve filter URL`. Keep commits small and unrelated changes separate. Pull requests should explain the behavior change, list verification commands, note migrations or configuration changes, and include before/after screenshots for UI work.
