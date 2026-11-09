# Food Recipes engineering backlog

The first milestone stabilizes the personal Discover, Plan, Shop and Cook workflow. The platform brief also includes public community features. Schedule those as a separate milestone after the personal workflow is verified.

## Inventory at 13e1bb6

| Area | Status | Existing implementation and gap | Priority / effort |
|---|---|---|---|
| Account | Partial | Auth and users modules support local registration, session rotation, recovery, verification and settings. Google OAuth and moderator role are absent. Require explicit permission boundaries for any new role. | P0 / medium |
| Recipe editor and details | Implemented with gaps | Recipes, recipe metadata and media cover ownership, drafts, publishing, structured ingredients and images. Detail has metadata and sharing. Verify Recipe JSON-LD and distinguish archive from any requested unpublish transition. | P0 / medium |
| Discovery | Partial | Food listing has server paging, search and filters. PostgreSQL search indexes and ingredient suggestions exist. Verify standalone cuisine, difficulty and dietary facets before extending query DTOs and indexes. | P0 / medium |
| Saved and profile | Partial | Wishlist, collections and account settings exist. Verify saved pagination. Public profile requires separate privacy and visibility rules. | P0 / medium |
| Planner and pantry | Implemented with gaps | Planning has persistence, templates, recurring meals, preview generation and responsive views. Pantry tracks quantities and expiry. E2E selectors and fixtures need alignment with current UI. | P0 quality / low |
| Shopping and cooking | Partial | Recipe shopping import, pantry comparison, guided steps, timers, history and leftovers exist. Validate preview/confirmation, quantity aggregation across a week and concurrency. Screen Wake Lock is a later enhancement. | P0 integrity / medium |
| Community and administration | Partial | Ratings, reviews, reporting, collections and sharing exist. Comment threads, follows and an admin UI require moderation, ownership and privacy contracts. | P1 / high |
| Recommendations and notifications | Partial | Explainable home feed and notification preferences exist. AI assistant and ingredient image recognition are unimplemented. Gate further work on validated use cases and operating cost. | P2 / high |

The repo uses separate pnpm packages with React, Vite and TypeScript on the frontend and NestJS, Prisma and PostgreSQL on the backend. Docker and GitHub Actions support deployment and checks. Existing Vitest, Jest and Playwright suites cover separate verification layers.

## Order of work

1. Restore repeatable quality checks. Keep strict mock request handling and update known shell endpoints and changed UI semantics. Verify editing, authorization, drafts and responsive behavior in Chromium. No API or schema change.
2. Validate the separate local changes for direct dotenv dependency, preparation preview and completion handling before integrating them. Use an empty PostgreSQL database with migrations and seed, then run both real and mock suites. Test retries and concurrent writes against PostgreSQL.
3. Review recipe discovery and Saved pagination. Document API compatibility before extending filters and page responses. Verify query plans against representative data and test empty results and private visibility.
4. Add Recipe structured data from the public detail model. Test canonical URLs, required fields and exclusion of private drafts.
5. Scope community features and administration as a distinct milestone. Define report triage, role permissions, public profile visibility and audit records before implementation.

## Baseline evidence

The earlier run at 13e1bb6 recorded 415 frontend tests passing, 12 backend API contract tests passing, 26 migrations applied on fresh PostgreSQL, and 8 of 9 real-stack tests passing after retrying the two fixed-port inventory cases. The backend Jest config suite failed to resolve dotenv/config. The full mock browser run recorded 50 of 62 passing. These numbers describe that commit and do not verify the pending changes in the primary checkout.
