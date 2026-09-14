# Production roadmap

Last reviewed: 2026-09-14

The product is optimized for home cooks and public recipe discovery. Work is
delivered in small, reviewable waves on `feat/recipe-platform-production-quality`.
Each feature is complete only when its migration (if needed), API contract,
frontend flow, focused tests, browser journey, and documentation are updated.

## P0 delivery order

### A. Discovery and SEO

Completed in the current wave:

- Recipe JSON-LD is emitted from public recipe fields with safe rich-result
  boundaries.
- Robots metadata and canonical/social URLs are managed consistently.
- Home and related-recipe reads are bounded by the Home feed contract.

- Keep recipe search, filters, sort, and pagination server-side and bounded.
- Add valid `Recipe` structured data only from public recipe fields and genuine rating aggregates.
- Keep account, planning, pantry, import, and error surfaces out of search indexes.
- Bound Home and related-recipe reads so the landing page does not fetch an entire catalog.
- Verify canonical URLs, robots metadata, social previews, mobile layout, keyboard behavior, and retryable errors.

### B. Authentication and security

- Completed in the current wave: accessible forgot-password, reset-password,
  email-verification, and authenticated resend flows use the existing
  single-use token endpoints.
- Recovery forms preserve generic responses, safe error states, password
  manager support, keyboard access, and token-free rendered output.
- Authenticated unverified users receive a dismissible verification reminder;
  successful verification updates the in-memory and persisted user metadata.
- Production auth delivery configuration now fails fast when the mail webhook
  or public web origin is missing.
- Focused API/service/component tests and six mocked browser journeys pass.
- Preserve generic recovery responses, HttpOnly refresh cookies, token rotation, session revocation, and auth throttling.
- Keep recovery delivery behind configuration; local and staging migrations may be rehearsed, but production operations remain operator-controlled.
- Verify login, signup, logout, refresh failure, recovery, verification, ownership, and safe internal redirects.

### E. Planning, shopping, and pantry

- Preserve the complete path: recipe -> plan -> shopping list -> pantry -> cooking -> history/journal.
- Add query indexes for the high-frequency personal and household planning/list views.
- Keep household roles and read-only behavior enforced on the server and visible in the UI.
- Verify duplicate prevention, shortage handling, checked-item import, leftovers, mobile layouts, and recovery from failed mutations.

## Follow-up waves

- Migrate the remaining feature SCSS to plain CSS/Tailwind-compatible styles and remove Sass only after import, build, and test scans pass.
- Keep dependency cleanup evidence-led. A package is removable only when imports, scripts, build configuration, tests, and runtime roles are all accounted for.
- Add observability, object storage, and asynchronous infrastructure only when the deployment topology requires them.

## Release gates

- Frontend: application TypeScript guard, ESLint, TypeScript, Vitest, production build, and mocked Playwright quality journeys.
- Backend: Prisma generation/validation, typecheck, Jest, static migration/security validators, production build, and API E2E.
- Cross-package: `git diff --check`, exact staged paths, Conventional Commit validation, and no secrets or environment files.
- Database changes: validate locally and rehearse against a disposable or staging database; never infer a production migration result from static validation.
