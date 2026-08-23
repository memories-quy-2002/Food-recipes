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
- NestJS request logging, centralized exception handling, CORS, validation, and PostgreSQL persistence.

## Tech Stack

- Frontend: React, TypeScript, Vite, React Router, Redux Toolkit, React Bootstrap, SCSS
- Server state: TanStack Query
- Forms and validation: React Hook Form + Zod for recipe forms
- API: REST/OpenAPI-compatible NestJS `/api/v1`, optionally fronted by Kong
- Backend: Node.js, NestJS, PostgreSQL, Prisma, JWT tokens, and RBAC
- Infrastructure: Docker and Kong enforcement
- Deployment: Vercel frontend and containerized NestJS API

PostgreSQL, Prisma, JWT refresh, RBAC, Docker, and Kong enforcement are backend or infrastructure-owned concerns. They do not run in browser code. Only intentionally public `VITE_*` build variables are exposed to the frontend.

## Project Structure

```text
Food-recipes/
  index.html            Vite HTML entry
  package.json          Frontend scripts and shared dependencies
  vercel.json           Frontend SPA rewrites for Vercel
  vite.config.ts        Vite config with @ alias to src/frontend
  src/
    frontend/
      app/              App shell, providers, route definitions, store, global app styles
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
      apps/api/         NestJS API, Prisma schema, migrations, and tests
```

Frontend imports can use `@` for `src/frontend`, for example `@/shared/api/axios` or `@/features/recipes/Recipe`.

## Getting Started

### Prerequisites

- Node.js
- pnpm through Corepack, or npm
- PostgreSQL database

### Install dependencies

```bash
pnpm install
```

If `pnpm` is not available yet, run `corepack enable` first.

### Configure the backend

Copy `src/backend/apps/api/.env.example` to `src/backend/apps/api/.env`, then
set the Nest API environment variables before starting it:

```env
DATABASE_URL=postgresql://your_postgres_user:your_postgres_password@localhost:5432/food_recipes
JWT_SECRET=replace_with_a_random_value_at_least_32_characters_long
CORS_ORIGINS=http://localhost:5173
```

`JWT_SECRET` must be a non-placeholder value with at least 32 characters. The
Docker development stack can provide PostgreSQL and the Nest API; Kong can be
run separately when gateway behavior is needed.

```env
PORT=3000
```

### Run locally

Start the frontend and backend together from the project root:

```bash
pnpm start
```

Local URLs:

- Frontend: `http://localhost:5173`
- Nest API: `http://localhost:3000/api/v1`

During development, `pnpm start` runs Vite on `http://localhost:5173` and the
Nest API in watch mode from `src/backend/apps/api` on port `3000`. The combined
runner points the frontend at the local Nest API under `/api/v1`. If `5173` is
already in use, Vite prints the next available port.

To run only one side:

```bash
pnpm run start:client
pnpm run start:backend
```

## Build

```bash
pnpm build
```

## Verification

Run the deterministic frontend gates locally:

```bash
corepack pnpm typecheck
corepack pnpm test:ci
corepack pnpm build
corepack pnpm test:e2e:ci
```

The interactive development commands remain available:

```bash
pnpm test
pnpm test:e2e
```

The Playwright suite runs against the Vite preview server and uses its existing browser-facing journey assertions. CI installs Chromium explicitly before running it.

## Database and seeds

Prisma migrations and seed-related backend artifacts live under
`src/backend/apps/api/prisma/`.

## Deployment Notes

- Nest/Kong is the supported API deployment: set public `VITE_KONG_BASE_URL=https://your-kong-gateway.example.com`; the frontend then uses the Kong `/api/v1` gateway.
- Set public `VITE_SITE_URL` if the public frontend URL changes so Helmet canonical URLs stay accurate.
- Vercel runs `pnpm build`, serves the `dist` output, and rewrites client-side routes to `index.html` while keeping asset paths safe.
- The Nest API is built from `src/backend/apps/api` and should be deployed behind the configured Kong gateway.

## Documentation

- [Changelog](./CHANGELOG.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## License

No license has been declared yet. Add a `LICENSE` file before publishing if you want to define reuse terms.
