# Changelog

All notable changes to Food Recipes are recorded here for developer review.
Detailed implementation plans and design decisions are preserved under
[`docs/archive`](./docs/archive/).

## [Unreleased]

### Added

- A canonical documentation index, production roadmap, and tracked-file audit.
- A versioned NestJS REST API under `src/backend` with `/api/v1` routes,
  Swagger documentation, Prisma migrations, PostgreSQL persistence, and
  independent frontend/backend package roots.
- Public and personalized Home feeds, bounded recipe discovery search,
  server-side filtering/sorting/pagination, recipe lifecycle metadata, saved
  collections, planning, shopping, pantry, household, cooking-session,
  leftovers, history, journal, notification, preference, recommendation, and
  recipe-import flows.
- JWT access authentication with HttpOnly refresh-cookie rotation, hashed
  sessions, reuse-family revocation, password recovery tokens, email
  verification tokens, auth throttling, ownership checks, and bounded request
  bodies.
- Shared Tailwind/shadcn-style UI primitives, route-aware metadata, public
  recipe SEO structured data, and production-focused migration validators.

### Changed

- Current documentation now describes the actual independent package layout and
  current Nest controller surface; legacy `apps/api` and `src/server` paths are
  no longer presented as active instructions.
- Frontend API consumers use the current DTO and status-code contracts while
  keeping compatibility bridges isolated and documented.
- Public Home and related-recipe surfaces now use bounded, deduplicated feed
  data instead of loading the complete recipe catalog.
- Recipe detail metadata now includes validated Recipe JSON-LD and maintains a
  single authoritative robots directive across SPA navigation.
- Account recovery now includes accessible forgot-password, reset-password,
  email-verification, and authenticated resend flows with generic responses,
  safe error states, and token-free rendered output.
- Production auth delivery configuration now fails fast when the recovery
  webhook or public web origin is missing; local and test delivery behavior
  remains configurable.
- Planning, shopping, and pantry continuity now has scoped query indexes,
  guarded unchecked-item uniqueness, concurrent-safe imports, stable duplicate
  conflicts, and a full deterministic kitchen-loop browser regression.
- Historical implementation plans, design specs, and task reports are stored in
  `docs/archive` instead of being mixed with active runbooks.
- Shopping-list edit failures now keep the editor open so a cook can correct or
  retry the mutation instead of seeing a premature success message.

### Removed

- Verified-unused Vite starter and column-toggle assets.

### Planned

- Migrate the remaining feature SCSS to CSS/Tailwind-compatible styles, then
  remove the Sass dependency after import, build, and test scans pass.

### Verification

- Frontend application TypeScript guard, ESLint, TypeScript, Vitest, and Vite
  production build are required gates.
- Backend Prisma validation/generation, TypeScript, Jest, static validators,
  and production build are required gates.
- Playwright quality and real-stack suites remain separate. CI installs the
  browser and provisions the real stack only when its workflow explicitly says
  so; a local missing browser is an environment blocker, not a passing result.
- Database migrations and demo reset operations remain local/staging or
  operator-controlled. Static validation does not claim production execution.
