# Food Recipes

Food Recipes is a full-stack recipe website for discovering meals, saving favorites, rating recipes, writing reviews, and sharing personal recipes. The frontend is a React + TypeScript + Vite application, while the backend provides the recipe API and persistence services.

## Features

- Browse recipes with search, category filters, meal filters, and sorting.
- View recipe details with cooking time, ratings, reviews, and related recipes.
- Create an account, log in, manage profile details, and change passwords.
- Save recipes to a wishlist and manage saved recipes interactively.
- Add new recipes with ingredients, instructions, timing, and image preview.
- Read News and About pages for project updates and product context.
- SEO metadata with React Helmet for page titles, descriptions, canonical URLs, and social previews.
- NestJS request logging, centralized exception filters, CORS, validation, Swagger, and PostgreSQL persistence.

## Tech Stack

- Frontend: React, TypeScript, Vite, React Router, Redux Toolkit, React Bootstrap, SCSS
- Server state: TanStack Query
- Forms and validation: React Hook Form + Zod for recipe forms
- API: REST/OpenAPI-compatible NestJS `/api/v1`, optionally fronted by Kong
- Backend: Node.js, NestJS, PostgreSQL, Prisma 7, and REST/OpenAPI
- Authentication: JWT bearer authentication for protected routes
- Infrastructure: Docker Compose; Kong is available for the production-like stack
- Deployment: Vercel frontend and containerized NestJS API

PostgreSQL, Prisma, JWT signing, Docker, and Kong are backend or infrastructure-owned concerns. They do not run in browser code. Only intentionally public `VITE_*` build variables are exposed to the frontend. The current NestJS API implements JWT bearer authentication; refresh-token rotation and RBAC are not yet exposed by the current API source.

## Project Structure

```text
Food-recipes/
  README.md             Project overview and local workflow
  src/
    frontend/
      package.json       Frontend dependencies and scripts
      pnpm-lock.yaml     Frontend lockfile
      pnpm-workspace.yaml pnpm build-approval configuration
      eslint.config.mjs  Frontend ESLint flat config
      index.html         Vite HTML entry
      main.jsx           Frontend bootstrap
      vite.config.ts     Vite config with @ alias to the frontend root
      jsconfig.json      Frontend JavaScript editor settings
      vite-env.d.ts      Vite environment types
      tsconfig.json      Frontend TypeScript settings
      vercel.json        Frontend SPA rewrites for Vercel
      e2e/               Browser journeys and Playwright config
      app/               App shell, providers, routes, store, global styles
      features/
        auth/           Account forms, auth hooks, auth state, protected route
        content/        About, News, and error pages
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
        seo/            Helmet helpers
        ui/             Reusable UI states
        utils/          Formatting, image, rating, and content helpers
    backend/
      package.json         Backend workspace scripts and package-manager pin
      pnpm-workspace.yaml  Backend workspace definition
      pnpm-lock.yaml       Backend workspace lockfile
      .env.example         Backend Compose environment template
      infrastructure/      Docker Compose and Kong configuration
      apps/api/            NestJS API package, Dockerfile, Prisma schema, migrations, and tests
        package.json       API dependencies and scripts
        .env.example       Direct Nest API environment template
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
backend workspace packages declare `pnpm@11.18.0` in `package.json`.

### Configure the backend

For direct Nest development, copy `src/backend/apps/api/.env.example` to
`src/backend/apps/api/.env`, then set the API environment variables.

```env
DATABASE_URL=postgresql://your_postgres_user:your_postgres_password@localhost:5432/food_recipes
JWT_SECRET=replace_with_a_random_value_at_least_32_characters_long
CORS_ORIGINS=http://localhost:5173
```

`JWT_SECRET` must be a non-placeholder value with at least 32 characters.

For the backend container stack, copy `src/backend/.env.example` to
`src/backend/.env` and run Compose from `src/backend`:

```powershell
cd src/backend
docker compose --project-directory . -f infrastructure/docker/docker-compose.dev.yml up --build
```

### Configure the frontend

Copy `src/frontend/.env.example` to `src/frontend/.env` and set only public
`VITE_*` values. The frontend appends `/api/v1` to `VITE_KONG_BASE_URL`.

- Direct Nest API or the development Compose stack: `VITE_KONG_BASE_URL=http://localhost:3000`
- Production-like Compose stack with Kong: `VITE_KONG_BASE_URL=http://localhost:8000`

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
- Kong proxy in the production-like Compose stack: `http://localhost:8000/api/v1`

If the backend is provided by Docker Compose, do not start the local Nest API
process at the same time. The development Compose file publishes the API on
port `3000`; the production-like Compose file keeps the API internal and
publishes Kong on port `8000`.

## Build

```powershell
cd src/frontend
pnpm build
```

The frontend package also provides `pnpm dev`, `pnpm preview`, `pnpm lint`,
`pnpm typecheck`, `pnpm test`, `pnpm test:ci`, and `pnpm test:e2e:ci`.

## Verification

Run the frontend gates from `src/frontend`:

```powershell
cd src/frontend
pnpm check
pnpm test:e2e:ci
```

Run the backend workspace gates from `src/backend`:

```powershell
cd src/backend
corepack pnpm@11.18.0 check
corepack pnpm@11.18.0 build
corepack pnpm@11.18.0 test:e2e
corepack pnpm@11.18.0 prisma:validate
```

`pnpm check` runs lint, typecheck, and the non-watch test suite for the
frontend. The backend `pnpm check` runs typecheck and Jest. The Playwright
suite runs against the Vite preview server and uses its existing
browser-facing journey assertions. CI installs Chromium explicitly before
running it.

Use `corepack pnpm@11.18.0 infra:down` from `src/backend` to stop the development Compose
stack. The backend workspace forwards API and Prisma commands to
`@food-recipes/api` with pnpm filters.

## Database and migrations

Prisma schema and migrations live under `src/backend/apps/api/prisma/`.
`corepack pnpm@11.18.0 prisma:validate` and `corepack pnpm@11.18.0 prisma:generate` validate checked-in
artifacts without applying database changes. Migration and introspection
commands require a configured database.

The legacy baseline and the known `recipes.image_url` evidence discrepancy are
documented in [the backend API README](./src/backend/apps/api/README.md). Do
not mark the baseline as applied to an existing database until that schema has
been backed up and reconciled.

## Deployment Notes

- Nest/Kong is the supported production-like API deployment: set public `VITE_KONG_BASE_URL=https://your-kong-gateway.example.com`; the frontend then uses the Kong `/api/v1` gateway.
- Set public `VITE_SITE_URL` if the public frontend URL changes so Helmet canonical URLs stay accurate.
- Configure the Vercel project root directory as `src/frontend`; Vercel then runs that package's `pnpm build`, serves its `dist` output, and applies the SPA rewrites from `src/frontend/vercel.json`.
- The backend Compose files live under `src/backend/infrastructure`; the API image uses `src/backend` as its build context and `apps/api/Dockerfile`, and should be deployed behind the configured Kong gateway.

## Documentation

- [Changelog](./CHANGELOG.md)
- [Backend API and migration notes](./src/backend/apps/api/README.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## License

No license has been declared yet. Add a `LICENSE` file before publishing if you want to define reuse terms.
