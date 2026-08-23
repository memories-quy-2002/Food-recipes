# Prisma Demo Seed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a repeatable local Prisma seed that creates a coherent demo graph across users, taxonomy, recipes, wishlist rows, and ratings while preserving the existing legacy schema and migration baseline.

**Architecture:** Configure Prisma 7 seeding through `prisma.config.ts`. The seed uses Prisma Client for supported scalar models and parameterized SQL for recipes because the legacy PostgreSQL interval columns are exposed as `Unsupported` fields. Demo records are identified by stable local-only names/emails so rerunning the seed refreshes only the demo graph instead of resetting the database.

**Tech Stack:** Prisma 7, PostgreSQL, `@prisma/adapter-pg`, TypeScript, `ts-node`, pnpm 11.18.0.

## Global Constraints

- Preserve `prisma/migrations/0_init` and the duration normalization migration.
- Never run `prisma migrate reset`.
- Do not print or commit values from `.env`.
- Keep demo foreign keys connected through IDs returned from inserted/located parent rows.
- Preserve unrelated dirty work in the repository.

---

### Task 1: Configure Prisma seed execution

**Files:**
- Modify: `src/backend/prisma.config.ts`
- Modify: `src/backend/package.json`

**Produces:** Prisma 7 knows how to execute the TypeScript seed command through `prisma db seed`, and the API package exposes a direct seed script.

- [ ] Add `migrations.seed` with a Windows-compatible `corepack pnpm@11.18.0 exec ts-node --transpile-only prisma/seed.ts` command.
- [ ] Add `prisma:seed` to the backend package scripts using `prisma db seed --config prisma.config.ts`.
- [ ] Validate the config without connecting to PostgreSQL.

### Task 2: Implement a linked, rerunnable demo seed

**Files:**
- Create: `src/backend/prisma/seed.ts`

**Produces:** A single transaction seeds users, categories, meals, recipes, wishlist records, and ratings in parent-to-child order. Re-running it removes/replaces only rows marked by the seed's stable demo identifiers.

- [ ] Instantiate Prisma 7 with `PrismaPg` and `DATABASE_URL`.
- [ ] Locate or create demo users by unique emails; use bcrypt-compatible hashes and safe local credentials.
- [ ] Locate or create demo categories and meals by stable names.
- [ ] Remove existing demo child rows before refreshing demo parents, in FK-safe order.
- [ ] Insert recipes with the returned user/category/meal IDs and write both minute and interval duration columns using `make_interval`.
- [ ] Insert wishlist and rating rows referencing returned user and recipe IDs, respecting both composite unique constraints and rating score checks.
- [ ] Print only stable demo account emails and row counts, never passwords or connection strings.

### Task 3: Run Prisma and local database verification

**Files:**
- No additional source files expected.

- [ ] Run `prisma validate` and `prisma generate`.
- [ ] Start only the local PostgreSQL service if it is not already running; do not reset data.
- [ ] Run `prisma migrate deploy` against the configured local database.
- [ ] Run `prisma db seed`.
- [ ] Query counts and joins for every seeded relationship: recipe author/category/meal, wishlist owner/recipe, and rating reviewer/recipe.
- [ ] Run targeted backend checks and inspect `git diff`/`git status` for scope.

### Task 4: Completion review

- [ ] Confirm generated client and migrations remain valid.
- [ ] Confirm the seed is repeatable and does not create duplicate demo rows.
- [ ] Report changed files, commands that passed, database availability, and any limitation if local PostgreSQL was unavailable.
