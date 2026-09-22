# Product overview

Last reviewed: 2026-09-22

Food Recipes helps an individual cook discover recipes and carry them through
personal planning, shopping, pantry tracking, cooking, and reflection.

## Users and scope

- Guests can discover public recipes and preview a recipe import.
- Signed-in users can manage their profile, recipes, saved content, meal plans,
  shopping and pantry items, cooking history, and journals.
- Each signed-in account has a private personal kitchen for its own planning,
  shopping, pantry, cooking history, leftovers, and journals.

The [current user journeys](../docs/frontend/current-user-journeys.md) describe
observable behavior. The [production roadmap](../docs/roadmap.md) may include
work that is still in progress.

## Packages

The repository contains two independent pnpm packages:

- src/frontend/ is a React, TypeScript, and Vite application using React Router,
  TanStack Query, Tailwind CSS v4, and feature-oriented folders.
- src/backend/ is a NestJS REST API using PostgreSQL and Prisma. Routes use the
  /api/v1 prefix.

Run commands from the package they affect. The repository root is not a pnpm
workspace. See [AGENTS.md](../AGENTS.md) and [README.md](../README.md) for setup.

## Product capabilities

- Recipe discovery, search, filters, details, ratings, and reviews
- Account, profile, preferences, and notification settings
- Recipe authoring, publishing, archiving, and restoration
- Saved recipes, collections, and private notes
- Meal plans, templates, recurring rules, shopping lists, and pantry inventory
- Persisted cooking sessions, history, leftovers, and private journals
- Server-side preview of public recipe URLs into private drafts

See the [API contract](../docs/backend/current-api-contract.md) and
[user journeys](../docs/frontend/current-user-journeys.md) for details.
