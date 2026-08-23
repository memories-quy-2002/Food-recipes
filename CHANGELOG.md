# Changelog

All notable changes to Food Recipes will be documented in this file.

The format follows the spirit of Keep a Changelog, and this project uses
calendar dates for release entries.

## [Unreleased]

### Added

- NestJS API under `src/backend/apps/api` with REST routes under `/api/v1`.
- OpenAPI/Swagger UI at `/api/docs` and the generated document at
  `/api/docs-json`.
- Prisma 7 schema, generated client configuration, baseline migrations, and
  migration validation artifacts for the legacy PostgreSQL database.
- Independent pnpm package roots for the frontend and backend, with the
  backend workspace forwarding commands to `@food-recipes/api`; both are
  pinned to `pnpm@11.18.0`.
- Frontend lint, typecheck, unit-test, and Playwright commands.
- Backend typecheck, Jest, Prisma, build, and migration commands.
- Docker Compose development and production-like infrastructure with
  PostgreSQL, a migration service, the Nest API, and optional Kong gateway
  routing.
- JWT bearer authentication for signup, login, token resolution, and
  protected account, recipe, rating, and wishlist routes.
- React Helmet SEO metadata, including page titles, descriptions, canonical
  URLs, Open Graph tags, and Twitter card metadata.
- News and About pages, recipe and rating UI flows, and related recipe content.
- Tailwind CSS v4 through the Vite plugin, shadcn/ui metadata, semantic theme
  tokens, and a shared `cn` utility for the incremental styling foundation.
- A shadcn-style `Button` primitive and `PageState` pilot integration; Bootstrap,
  react-bootstrap, and existing SCSS remain in place during migration.

### Changed

- Split the application layout into `src/frontend` and `src/backend` instead
  of keeping frontend scripts and server code at the repository root.
- Updated local development to run Vite and NestJS from their own package
  directories. The frontend runs on port `5173`; the direct Nest API runs on
  port `3000`.
- Frontend API requests now use `VITE_KONG_BASE_URL` and append `/api/v1`.
  The development Compose stack exposes the API directly; the
  production-like stack routes through Kong on port `8000`.
- Replaced the previous Express-oriented request and error handling with
  NestJS logging, global exception filters, validation, CORS, and Swagger
  bootstrap configuration.
- Updated Vercel deployment configuration to use `src/frontend` as the
  project root and serve its Vite `dist` output with SPA rewrites.
- Improved Home, Header, Footer, Food, Profile, Wishlist, Recipes, Add
  Recipe, Login, and Signup UI states and interactions.

### Fixed

- Prevented review UI crashes when a user has not rated a recipe yet.
- Prevented duplicate `(user_id, recipe_id)` rating seed keys.
- Fixed Home hero layout and search alignment issues.
- Preserved JWT validation and protected-route behavior while moving the API
  to NestJS.
- Removed the undefined `reportWebVitals()` runtime call.

### Deployment notes

- Prisma baseline application to an existing database remains gated by backup,
  schema inspection, and reconciliation of the documented `image_url`
  discrepancy. Static validation does not prove live database parity.
- JWT refresh-token rotation and RBAC are not yet exposed by the current
  NestJS API source.
