# Architecture

Last reviewed: 2026-09-22

## Package boundaries

src/frontend/ and src/backend/ are independent packages with their own manifests,
lockfiles, dependencies, and commands. Do not add root-level orchestration
without an explicit architecture change.

### Frontend

- app/ owns setup, providers, routing, shared state, and global styles.
- features/ owns domain pages and behavior such as recipes, planning, pantry, shopping, and cooking history.
- shared/api/ owns the HTTP client, API configuration, payload handling, and
  query helpers.
- shared/ui/ owns reusable UI primitives and page states.
- shared/utils/ owns cross-feature formatting and image helpers.

Keep server state in TanStack Query and short-lived interaction state close to
the component that uses it. Use the @ alias for imports from the frontend root.

### Backend

- src/modules/ contains NestJS domain modules.
- Controllers handle HTTP input and output; services coordinate business rules;
  repositories own database access.
- src/common/ and src/infrastructure/ contain cross-cutting services and
  integrations such as analytics and Prisma.
- prisma/schema.prisma and prisma/migrations/ define the PostgreSQL data model
  and migration history.

The API modules are composed in
[src/backend/src/app.module.ts](../src/backend/src/app.module.ts). Keep
ownership checks on the server for private user resources. Kitchen APIs operate
on the authenticated account only. Legacy scope tables and nullable columns
remain in PostgreSQL for data retention; runtime modules do not expose shared
kitchen routes.

## Request and data boundaries

- The frontend calls the versioned REST API under /api/v1 through the shared
  Axios client.
- Protected browser requests use JWT access tokens and a refresh-cookie flow.
  Access tokens stay in frontend memory.
- PostgreSQL and Prisma belong to the backend package.
- Runtime DTOs and controllers define each route's current response shape.
  Preserve compatibility behavior unless a task changes it deliberately.

## Delivery boundaries

[CI/CD and release operations](../docs/ci-cd.md) documents the active workflows.
GitHub Actions validates frontend and backend changes. The backend job uses an
ephemeral PostgreSQL service to apply migrations and verify the demo seed;
Vercel is configured to deploy the frontend from master. The repository builds
the API runtime image in CI but does not publish it or deploy the API to a
runtime host. Production migration, baseline, and reset/seed operations are
separate manual workflows gated by a full Quality Gates run on the same master
commit.

## References

- [Frontend package](../src/frontend/package.json)
- [Backend package](../src/backend/package.json)
- [Prisma schema](../src/backend/prisma/schema.prisma)
- [Current API contract](../docs/backend/current-api-contract.md)
- [Repository rules](../AGENTS.md)

Update this page when package boundaries, API ownership, persistence, or
cross-cutting security rules change.
