<p align="center">
  <img src="./docs/assets/readme-hero.svg" alt="Food Recipes — discover, plan, cook and remember, illustrated with a fresh pasta dish" width="100%" />
</p>

<p align="center">
  <strong>A connected kitchen companion for discovering recipes, planning meals, preparing ingredients, and enjoying the cooking process.</strong>
</p>

<p align="center">
  <a href="https://foodrecipes1.vercel.app/"><img alt="Explore live app" src="https://img.shields.io/badge/Explore_the_app-2C4233?style=for-the-badge&amp;logo=vercel&amp;logoColor=white" /></a>
  <a href="./docs/README.md"><img alt="Read documentation" src="https://img.shields.io/badge/Documentation-ED732F?style=for-the-badge&amp;logo=readthedocs&amp;logoColor=white" /></a>
  <a href="#getting-started"><img alt="Get started" src="https://img.shields.io/badge/Get_started-85664F?style=for-the-badge&amp;logo=rocket&amp;logoColor=white" /></a>
</p>

<p align="center">
  <a href="https://github.com/memories-quy-2002/Food-recipes/actions/workflows/quality-gates.yml"><img alt="Quality gates on master" src="https://github.com/memories-quy-2002/Food-recipes/actions/workflows/quality-gates.yml/badge.svg?branch=master" /></a>
  <img alt="React 19" src="https://img.shields.io/badge/React-19-149ECA?logo=react&amp;logoColor=white" />
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-API-E0234E?logo=nestjs&amp;logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&amp;logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Full_stack-3178C6?logo=typescript&amp;logoColor=white" />
</p>

---

## Why Food Recipes?

Most recipe apps stop at inspiration. **Food Recipes connects the entire home-cooking journey**: find a dish, save it, fit it into your week, check what is already in the pantry, prepare a shopping list, follow your cooking progress, and keep a record of what you made.

Built with **React + TypeScript** and a **NestJS + PostgreSQL** backend, the project balances user-facing kitchen workflows with a maintainable full-stack architecture.

## Explore the kitchen

| Find something worth cooking | Make a plan that works |
| :--- | :--- |
| **Recipe discovery** — Search, filter, sort, and explore recipes with details, ratings, reviews, and related dishes. | **Meal planning** — Organize meals with reusable templates and recurring rules, then import ingredients into a shopping list. |
| **Personal cookbook** — Save favorites, create collections, and keep private notes on recipes. | **Pantry-aware preparation** — Compare required ingredients with personal or household stock before cooking. |
| **Publish & share** — Draft, edit, publish, archive, or restore your own recipes; import a public recipe URL into a private draft. | **Cook & remember** — Track a cooking session, manage shortages and leftovers, then revisit cooking history and a private journal. |

> **Built for real households:** shared planning, shopping, pantry, and leftovers use role-aware access. Public recipe discovery remains available without a household.

## A little food inspiration

<p align="center"><em>Recipe photography already included in the application.</em></p>

| Breakfast inspiration | Everyday pasta | A quick seafood plate |
| :---: | :---: | :---: |
| <img src="./src/frontend/shared/assets/images/breakfast.png" alt="Breakfast food photography from the app's asset library" width="280" /> | <img src="./src/frontend/shared/assets/images/pesto_pasta.png" alt="Pesto pasta photo from the app's asset library" width="280" /> | <img src="./src/frontend/shared/assets/images/quick_shrimp_scampi.png" alt="Shrimp scampi photo from the app's asset library" width="280" /> |

## From a recipe to a routine

```mermaid
flowchart LR
    A["Discover<br/>recipes"] --> B["Save &amp;<br/>organize"]
    B --> C["Plan<br/>meals"]
    C --> D["Shop &amp;<br/>check pantry"]
    D --> E["Cook &amp;<br/>track"]
    E --> F["History &amp;<br/>journal"]
    F -.->|Cook again| C
```

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, React Router, Tailwind CSS 4, shadcn/ui |
| **State & forms** | TanStack Query, Redux Toolkit, React Hook Form, Zod |
| **Backend** | Node.js, NestJS, REST API, OpenAPI / Swagger |
| **Database** | PostgreSQL, Prisma 7 |
| **Auth & security** | JWT access tokens, refresh-token rotation, role-aware authorization, validation |
| **Development & delivery** | pnpm, Docker Compose, GitHub Actions, Vercel, Playwright, Jest / Vitest |

Only public `VITE_*` variables are used in browser builds. PostgreSQL, Prisma, signing keys, and migrations remain backend or infrastructure responsibilities.

### Architecture at a glance

```mermaid
flowchart LR
    subgraph Browser["Frontend · Vercel"]
      UI["React + TypeScript<br/>Redux Toolkit · TanStack Query"]
    end
    subgraph API["Backend · NestJS"]
      HTTP["REST /api/v1<br/>Auth · Recipes · Kitchen workflows"]
      Prisma["Prisma ORM"]
      HTTP --> Prisma
    end
    DB[("PostgreSQL")]
    UI -->|"HTTPS / JSON"| HTTP
    Prisma --> DB
```

## Project Structure

<details>
<summary><strong>Expand the repository layout</strong></summary>

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
        profile/        Profile details, personal recipes, and reviews
        recipes/        Recipe details, editing, cooking, sharing, and notes
        planning/       Meal plans, templates, recurring meals, and continuity
        shopping/       Shopping list and pantry preparation
        pantry/         Personal and household pantry inventory
        households/     Household membership and scope selection
        history/        Cooking history and completion handoff
        journal/        Private post-cook journal
        saved/          Saved collections
        preferences/    Food preferences and notification settings
        recommendations/ Personalized recommendations
        recipe-import/  URL preview and draft import
        wishlist/       Saved recipe page and saved recipe cards
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

</details>

## Getting Started

### Prerequisites

- Node.js 24 (the supported CI/runtime line)
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

- [Documentation index](./docs/README.md)
- [Production roadmap](./docs/roadmap.md)
- [Production-quality audit](./docs/audits/2026-09-14-production-quality-audit.md)
- [Changelog](./CHANGELOG.md)
- [Backend API and migration notes](./src/backend/README.prisma.md)
- [Legacy compatibility retirement plan](./docs/backend/legacy-compatibility-retirement.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## License

No license has been declared yet. Add a `LICENSE` file before publishing if you want to define reuse terms.

---

<p align="center">Designed and maintained by <a href="https://github.com/memories-quy-2002">Nguyen Manh Phu Quy</a>.</p>
