# Food Recipes

Food Recipes is a full-stack recipe website for discovering meals, saving favorites, rating recipes, writing reviews, and sharing personal recipes. The frontend is built with React and Vite, while the backend uses Express and PostgreSQL.

## Features

- Browse recipes with search, category filters, meal filters, and sorting.
- View recipe details with cooking time, ratings, reviews, and related recipes.
- Create an account, log in, manage profile details, and change passwords.
- Save recipes to a wishlist and manage saved recipes interactively.
- Add new recipes with ingredients, instructions, timing, and image preview.
- Read News and About pages for project updates and product context.
- SEO metadata with React Helmet for page titles, descriptions, canonical URLs, and social previews.
- Express request logging, centralized error handling, CORS handling, and PostgreSQL query logging.

## Tech Stack

- Frontend: React, Vite, React Router, Redux Toolkit, React Bootstrap, SCSS
- Backend: Node.js, Express, PostgreSQL, pg
- Auth and validation: JWT, bcryptjs, Yup
- Deployment: Vercel frontend and serverless Express API

## Project Structure

```text
Food-recipes/
  index.html            Vite HTML entry
  package.json          Frontend scripts and shared dependencies
  vercel.json           Frontend SPA rewrites for Vercel
  vite.config.ts        Vite config with @ alias to src/client
  src/
    client/
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
    server/
      api/              Vercel serverless entrypoint
      middleware/       Request logging and centralized error handling
      migrations/       Database migrations
      seeds/            Database seed data
      app.js            Express app setup
      queries.js        PostgreSQL query functions
```

Frontend imports can use `@` for `src/client`, for example `@/shared/api/axios` or `@/features/recipes/Recipe`.

## Getting Started

### Prerequisites

- Node.js
- pnpm through Corepack, or npm
- PostgreSQL database

### Install dependencies

```bash
pnpm install
cd src/server
pnpm install
cd ../..
```

If `pnpm` is not available yet, run `corepack enable` first.

### Configure the server

Create `src/server/.env` with:

```env
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_HOST=your_postgres_host
DB_PORT=5432
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret
```

Optional pool/logging settings:

```env
DB_POOL_MAX=2
DB_POOL_MIN=0
DB_POOL_IDLE_TIMEOUT_MS=5000
DB_POOL_CONNECTION_TIMEOUT_MS=5000
DB_POOL_MAX_LIFETIME_SECONDS=60
DB_QUERY_LOGGING=true
```

### Run locally

Start the frontend and backend together from the project root:

```bash
pnpm start
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

During development, `pnpm start` runs Vite on `http://localhost:5173` and the Express server on `http://localhost:4000`. If `5173` is already in use, Vite prints the next available port. The frontend uses `http://localhost:4000` unless `VITE_API_BASE_URL` is set.

To run only one side:

```bash
pnpm run start:client
pnpm run start:server
```

## Build

```bash
pnpm run build
```

## Verification

Run these checks after restructuring or changing shared modules:

```bash
pnpm run build
node --check src/server/app.js
node --check src/server/queries.js
```

## Database Seeds

Seed files live in `src/server/seeds/`. They include additional recipes and ratings used to enrich the recipe catalog.

## Deployment Notes

- The production frontend API defaults to `https://food-recipes-server-omega.vercel.app`.
- Set `VITE_API_BASE_URL` if the API deployment URL changes.
- Set `VITE_SITE_URL` if the public frontend URL changes so Helmet canonical URLs stay accurate.
- The server exports the Express app for Vercel and only calls `app.listen()` outside Vercel.

## Documentation

- [Changelog](./CHANGELOG.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## License

No license has been declared yet. Add a `LICENSE` file before publishing if you want to define reuse terms.
