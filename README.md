# Food Recipes

Food Recipes is a full-stack recipe website for discovering meals, saving favorites, rating recipes, writing reviews, and sharing personal recipes. The frontend is a React + TypeScript + Vite application, while the backend provides the recipe API and persistence services.

## Features

- Browse recipes with search, category filters, meal filters, and sorting.
- View recipe details with cooking time, ratings, reviews, and related recipes.
- Create an account, log in, manage profile details, and change passwords.
- Save recipes to a wishlist and manage saved recipes interactively.
- Add new recipes with ingredients, instructions, timing, and image preview.
- SEO metadata with the shared `PageHelmet` helper for page titles, descriptions, canonical URLs, and social previews.
- NestJS request logging, centralized exception filters, CORS, validation, Swagger, and PostgreSQL persistence.

## Tech Stack

- Frontend: React, TypeScript, Vite, React Router, Redux Toolkit, Tailwind CSS v4, shadcn/ui, and the remaining feature SCSS styles
- Server state: TanStack Query
- Forms and validation: React Hook Form + Zod for recipe forms
- API: REST/OpenAPI-compatible NestJS `/api/v1`
- Backend: Node.js, NestJS, PostgreSQL, Prisma 7, and REST/OpenAPI
- Authentication: JWT bearer authentication for protected routes
- Infrastructure: Docker Compose with direct NestJS API hosting
- Deployment: Vercel frontend and containerized NestJS API

PostgreSQL, Prisma, JWT signing, and Docker are backend or infrastructure-owned concerns. They do not run in browser code. Only intentionally public `VITE_*` build variables are exposed to the frontend. The current NestJS API implements JWT bearer authentication, refresh-token rotation, and role-aware protected routes.

## Project Structure

```text
Food-recipes/
  README.md             Project overview and local workflow
  src/
    frontend/
      package.json       Frontend dependencies and scripts
      pnpm-lock.yaml     Frontend lockfile
      pnpm-workspace.yaml pnpm build-approval configuration
      components.json     shadcn/ui metadata and aliases
      eslint.config.mjs  Frontend ESLint flat config
      index.html         Vite HTML entry
      main.tsx           Frontend bootstrap
      vite.config.mts    Vite config with @ alias to the frontend root
      vite-env.d.ts      Vite environment types
      tsconfig.json      Frontend TypeScript settings
      vercel.json        Frontend SPA rewrites for Vercel
      e2e/               Browser journeys and Playwright config
      app/               App shell, providers, routes, store, global styles
      features/
        auth/           Account forms, auth hooks, auth state, protected route
        content/        Error page and shared content states
        diagnostics/    Local-only health page
        food/           Food listing page and filters
        home/           Home page, carousel, search, featured recipe sections
        profile/        Profile details, personal recipes, reviews
        recipes/        Recipe details and add-recipe flow
        wishlist/       Wishlist page and saved recipe cards
      shared/
        api/            Axios client and payload helpers
        assets/         Images and icons
        layout/         Header, footer, and layout shell
        seo/            SEO helpers
        ui/             Reusable UI primitives and states
        lib/            Shared frontend libraries
          utils.ts      cn class-merging utility
        utils/          Formatting, image, rating, and content helpers
    backend/
      package.json         Backend dependencies and scripts
      pnpm-workspace.yaml  Backend root build-script policy (no nested packages)
      pnpm-lock.yaml       Backend lockfile
      .env.example         Direct Nest API environment template
      .env.compose.example Backend Compose environment template
      Dockerfile           Backend API image definition
      prisma/              Prisma schema, migrations, legacy evidence, and seed
      src/                 NestJS API source
      test/                Backend static and E2E tests
      infrastructure/      Docker Compose configuration
```

Frontend imports can use `@` for `src/frontend`, for example
`@/shared/api/axios` or `@/features/recipes/Recipe`.

## Getting Started

### Prerequisites

- Node.js
- pnpm 11.18.0 through Corepack
- Docker Desktop, if using the Compose stack
- PostgreSQL database, if running the API directly

### Install dependencies

Install each application from its own bounded package. The repository root is
not a pnpm workspace; `src/backend` and `src/frontend` are separate runtimes.

```bash
cd src/frontend
pnpm install

cd ../backend
corepack pnpm@11.18.0 install
```

If `pnpm` is not available yet, run `corepack enable` first. The frontend and
backend packages declare `pnpm@11.18.0` in `package.json`.

### Configure the backend

For direct Nest development, copy `src/backend/.env.example` to
`src/backend/.env`, then set the API environment variables.

```env
DATABASE_URL=postgresql://your_postgres_user:your_postgres_password@localhost:5432/food_recipes
JWT_SECRET=replace_with_a_random_value_at_least_32_characters_long
CORS_ORIGINS=http://localhost:5173
```

`JWT_SECRET` must be a non-placeholder value with at least 32 characters.

For the backend container stack, copy `src/backend/.env.compose.example` to
`src/backend/.env` and run Compose from `src/backend`:

```powershell
cd src/backend
docker compose --project-directory . -f infrastructure/docker/docker-compose.dev.yml up --build
```

### Configure the frontend

Copy `src/frontend/.env.example` to `src/frontend/.env` and set only public
`VITE_*` values. The frontend appends `/api/v1` to `VITE_API_BASE_URL`.

- Direct Nest API or either Compose stack: `VITE_API_BASE_URL=http://localhost:3000`

### Run locally

Run the frontend and backend from their own directories, in separate terminals:

```powershell
cd src/frontend
pnpm dev
```

```powershell
cd src/backend
corepack pnpm@11.18.0 dev
```

Local URLs:

- Frontend: `http://localhost:5173`
- Nest API: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/docs`
- Swagger JSON: `http://localhost:3000/api/docs-json`

If the backend is provided by Docker Compose, do not start the local Nest API
process at the same time. Both Compose files publish the API on the
configurable `API_PORT`, which defaults to `3000`.

### Fast local workflow

From the repository root, the developer control center can start and stop the
two applications without switching between package directories:

```powershell
.\tools\dev.ps1 start
.\tools\dev.ps1 status
.\tools\dev.ps1 stop
```

Use the Docker-backed API and PostgreSQL stack when needed:

```powershell
.\tools\dev.ps1 start -Mode docker
```

Run only the checks affected by the current worktree, or run the full package
gates when preparing a checkpoint:

```powershell
.\tools\verify.ps1 -Scope Changed
.\tools\verify.ps1 -Scope Changed -IncludeE2E
.\tools\verify.ps1 -Scope Full
```

Use `-DryRun` to inspect the selected commands without running them and
`-SkipBuild` for a faster feedback loop. `Changed` includes tracked and
untracked files and does not run package checks for documentation-only or
root-tooling changes. The repository root remains outside the pnpm workspace;
the scripts delegate to the independent `src/frontend` and `src/backend`
packages.

## Build

```powershell
cd src/frontend
pnpm build
```

The frontend package also provides `pnpm dev`, `pnpm preview`, `pnpm lint`,
`pnpm typecheck`, `pnpm test`, `pnpm test:ci`, `pnpm test:e2e:quality`,
`pnpm test:e2e:ci`, and `pnpm test:e2e:real`.

## Verification

Run the frontend gates from `src/frontend`:

```powershell
cd src/frontend
pnpm check
pnpm test:e2e:quality
```

`pnpm test:e2e:quality` runs the CI frontend-quality gate with mocked APIs:
retryable catalog failure recovery, mobile overflow and hit-target checks,
keyboard menu behavior, and serious/critical axe violations. The broader
`pnpm test:e2e:ci` command remains available for the full mocked journey set.
For acceptance coverage against the real NestJS API and PostgreSQL, start the
Docker-backed stack first and then run the managed real-stack runner:

```powershell
.\tools\dev.ps1 start -Mode docker
cd src/frontend
pnpm test:e2e:real
```

The real-stack runner builds a temporary frontend preview locally, starts it,
runs the authenticated and public journeys, and cleans up the preview process
when the suite exits. It requires the Docker-backed API and PostgreSQL stack;
the current GitHub workflow runs the mocked frontend-quality suite and does not
provision the real stack automatically.

Run the backend package gates from `src/backend`:

```powershell
cd src/backend
corepack pnpm@11.18.0 check
corepack pnpm@11.18.0 build
corepack pnpm@11.18.0 test:e2e
corepack pnpm@11.18.0 prisma:validate
```

`pnpm check` runs lint, typecheck, and the non-watch test suite for the
frontend. The backend `pnpm check` generates the Prisma client before running
typecheck and Jest. The mock Playwright suite runs against a managed Vite
preview server and keeps read assertions deterministic; the real-stack suite
exercises the API, database persistence, authorization, security headers, and
browser UI together. CI installs Chromium explicitly before running the
frontend-quality suite.

Use `corepack pnpm@11.18.0 infra:down` from `src/backend` to stop the development Compose
stack. All backend commands run directly from the single package at
`src/backend`.

## GitHub CI/CD

Pull requests and pushes to `master` run the required quality gates in
`.github/workflows/quality-gates.yml`. Backend and frontend checks run in
parallel, and failed Playwright runs retain short-lived test artifacts for
diagnosis. The workflow is read-only and never commits or pushes changes.

`.github/workflows/dependency-security.yml` reviews dependency changes in pull
requests and runs a weekly audit for both packages. Dependabot watches the
frontend, backend, and GitHub Actions dependency sources separately.

Vercel handles frontend preview and production deployments from the connected
GitHub repository. Production Prisma migrations remain a deliberate manual
operation through `.github/workflows/production-prisma-baseline.yml`.

## Database and migrations

Prisma schema and migrations live under `src/backend/prisma/`.
`corepack pnpm@11.18.0 prisma:validate` and `corepack pnpm@11.18.0 prisma:generate` validate checked-in
artifacts without applying database changes. Migration and introspection
commands require a configured database.

The legacy baseline and the known `recipes.image_url` evidence discrepancy are
documented in [the backend Prisma README](./src/backend/README.prisma.md). Do
not mark the baseline as applied to an existing database until that schema has
been backed up and reconciled.

## Deployment Notes

- The supported production-like deployment publishes the NestJS API directly: set public `VITE_API_BASE_URL=https://your-api.example.com`; the frontend then uses the NestJS `/api/v1` API.
- Set public `VITE_SITE_URL` if the public frontend URL changes so `PageHelmet` canonical URLs stay accurate.
- Configure the Vercel project root directory as `src/frontend`; Vercel then runs that package's `pnpm build`, serves its `dist` output, and applies the SPA rewrites from `src/frontend/vercel.json`.
- The backend Compose files live under `src/backend/infrastructure`; the API image uses `src/backend` as its build context and `Dockerfile`. For a public deployment, place the API behind the hosting platform's TLS and load-balancing layer.

## Recommended Technology Roadmap

The project is currently best served by a modular NestJS API, PostgreSQL, and
Prisma. The next additions should solve concrete product or operational needs:

1. Add backend OpenTelemetry traces and metrics plus structured JSON log shipping.
2. Complete one object-storage pipeline for recipe images with signed uploads,
   validation, thumbnails, and CDN delivery.
3. Add a transactional email provider for password recovery, verification, and
   future cooking reminders.
4. Add Redis-backed rate limiting and background jobs only when the API runs on
   multiple replicas or image/email work becomes asynchronous.
5. Start recipe search with PostgreSQL full-text search and `pg_trgm`; defer a
   separate search engine until the catalog requires it.

Microservices, Kafka, Kubernetes, GraphQL, and Elasticsearch would add
operational complexity without a clear need in the current single-API system.

## Documentation

- [Changelog](./CHANGELOG.md)
- [Backend API and migration notes](./src/backend/README.prisma.md)
- [Legacy compatibility retirement plan](./docs/backend/legacy-compatibility-retirement.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## License

No license has been declared yet. Add a `LICENSE` file before publishing if you want to define reuse terms.
