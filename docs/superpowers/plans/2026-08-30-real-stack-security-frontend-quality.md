# Real-stack acceptance, security, and frontend quality

## Goal

Add a repeatable verification layer that proves the Food Recipes application across a seeded PostgreSQL/NestJS/Vite stack, exercises security boundaries through HTTP, and keeps critical frontend error, responsive, and accessibility behavior observable in CI.

## Scope

- Keep the existing deterministic, API-stubbed Playwright journeys fast and independent of a running backend.
- Add a dedicated real-stack Playwright config and script for the existing kitchen journey plus new authentication, ownership, session, and public-discovery acceptance tests.
- Add backend HTTP security coverage for headers, validation, body limits, and protected-route behavior; keep the real-stack suite responsible for database-backed cross-user authorization.
- Add frontend Playwright quality coverage for retryable catalog errors, mobile layout, keyboard-reachable controls, and serious/critical axe violations.
- Add CI jobs with an ephemeral PostgreSQL service, migrations, seed data, backend readiness polling, Playwright browser installation, and failure artifacts.

## Verification commands

- `corepack pnpm@11.18.0 test -- --runInBand` from `src/backend` for focused backend tests.
- `pnpm test:ci` and `pnpm typecheck` from `src/frontend` for frontend checks.
- `pnpm test:e2e:ci` from `src/frontend` for deterministic browser journeys.
- `pnpm test:e2e:real` from `src/frontend` against a local Docker/Compose backend.
- Repository CI validators and the final package checks before completion.

## Implementation steps

1. Add failing assertions for the new CI contract and focused frontend quality/real-stack suites.
2. Implement real-stack helpers, config isolation, acceptance/security journeys, and frontend quality journeys.
3. Add backend security E2E coverage at the Nest HTTP boundary.
4. Wire scripts and CI jobs without using a production database or destructive reset.
5. Run red-green verification, then run the relevant package and repository gates; report any environment-dependent checks separately.
