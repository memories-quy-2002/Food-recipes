# Product and delivery roadmap

Last reviewed: 2026-09-22

This page records shipped product waves and the remaining verified rollout work.
Implementation details belong in the current API contract, user journeys, and
Wiki pages linked from the [documentation index](./README.md).

## Completed product waves

### Discovery and SEO

- Public recipe search, filtering, sorting, and pagination are bounded and
  handled by the API.
- Home and related-recipe reads use bounded feed data.
- Public recipe pages emit validated metadata and Recipe JSON-LD. Private and
  error surfaces stay out of search indexes.

### Authentication and security

- Password recovery and email verification use single-use tokens and generic
  public responses.
- The frontend includes recovery, verification, and authenticated resend flows.
- Production startup requires the configured recovery delivery webhook and
  public web origin.
- Access tokens remain in memory; refresh sessions use rotating HttpOnly
  cookies.

### Planning, shopping, pantry, and cooking

- The authenticated kitchen path is persisted from planning through shopping,
  pantry, cooking, history, and journals.
- The current kitchen experience is scoped to one signed-in cook; household
  membership, invitations, and shared kitchen flows have been removed from the
  active application and API.
- Shopping imports are duplicate-safe within each personal account; mutation
  failures preserve user edits for correction or retry.
- Existing household tables and scoped records remain legacy database data.
  They are neither deleted nor reassigned by the product-scope change.
- The kitchen-loop migration adds scoped indexes and guarded active-item
  uniqueness. The deterministic Playwright kitchen journey covers the main
  cross-feature loop.

### Frontend styles

- Active feature SCSS was migrated to plain CSS and the direct Sass dependency
  was removed.

## Remaining verified rollout work

- Rehearse migration `20260914100000_harden_kitchen_loop_indexes` against a
  disposable or staging database after checking legacy active-shopping
  duplicates. Inspect representative query plans and run the real-stack kitchen
  journey before a production rollout.
- Verify production recovery delivery and public web-origin configuration in
  the deployment environment. Passing startup validation does not prove email
  delivery.
- Keep production migration, baseline, and demo-reset operations operator
  controlled; static validation is not evidence of production execution.

## Release gates

The exact triggers, path filters, local commands, frontend deployment boundary,
and manual database workflows are documented in [CI/CD and release
operations](./ci-cd.md).

- Frontend changes: application TypeScript guard, lint, typecheck, unit tests,
  production build, and mocked Playwright quality journeys.
- Backend changes: Prisma validation/generation, migration and demo-seed
  verification against disposable PostgreSQL, typecheck, Jest, migration and
  security validators, production build, API E2E, and runtime Docker image
  build.
- Cross-package changes: run both package gate groups.
- Database changes: validate locally and rehearse against disposable or staging
  data; never infer a production result from static checks.
