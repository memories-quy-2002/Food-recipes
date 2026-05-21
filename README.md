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
  src/
    client/             React pages, components, hooks, styles, assets
    server/             Express API, PostgreSQL queries, seeds, Vercel API entry
  index.html            Vite HTML entry
  package.json          Frontend scripts and shared dependencies
  README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm or pnpm
- PostgreSQL database

### Install frontend dependencies

```bash
npm install
```

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

Start the backend:

```bash
cd src/server
npm install
npm start
```

Start the frontend from the project root:

```bash
npm start
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

During development, the frontend uses `http://localhost:4000` unless `VITE_API_BASE_URL` is set.

## Build

```bash
npm run build
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
