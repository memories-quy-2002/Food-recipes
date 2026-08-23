# Food Recipes NestJS migration

This is the execution plan for migrating the Express/PostgreSQL backend to a
NestJS modular monolith under `src/backend/apps/api` while moving the frontend
source tree to `src/frontend`.

The migration is additive first: Express remains available as a fallback, the
existing PostgreSQL schema is not reset, and the frontend is cut over only after
the NestJS API has feature parity and regression coverage.

The user approved direct work on the current branch with local commits only;
nothing from this migration will be pushed to `origin`.

The complete phase-by-phase requirements are preserved in the user-provided
implementation plan attachment. This file records the repository-specific
execution boundary and verification checkpoints.

## Repository target layout

```text
src/
├── frontend/                  # former src/client
├── server/                    # legacy Express fallback during migration
└── backend/
    └── apps/
        └── api/               # NestJS + Prisma API
infrastructure/
├── docker/
└── kong/
```

## Non-negotiable constraints

- No `prisma migrate reset`.
- No destructive schema change while Express is still a fallback.
- Protected identity comes from JWT, not a client-provided user id.
- Authentication stays in NestJS; Kong handles routing, request ids, and rate
  limiting.
- No Kafka, Redis, Kubernetes, CQRS, or microservices in this migration.
- Verification must distinguish legacy baseline failures from migration failures.
