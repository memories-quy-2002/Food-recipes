# Copilot Instructions — Food-recipes

## Project overview
Website for food recipes and blogs. Monorepo structure:
- `src/frontend/` — React + Vite + TypeScript frontend
- `src/backend/` — single NestJS + Prisma backend package and infrastructure

Database: PostgreSQL, hosted on Supabase. Package manager: pnpm, isolated between the frontend and backend packages.

## Setup & commands
- Install frontend dependencies: `cd src/frontend && pnpm install`
- Install backend dependencies: `cd src/backend && pnpm install`
- Run frontend dev server: `cd src/frontend && pnpm dev`
- Run backend dev server: `cd src/backend && pnpm dev`
- Typecheck frontend: `cd src/frontend && pnpm typecheck`
- Test backend: `cd src/backend && pnpm test`
- Run backend containers: `cd src/backend && docker compose --project-directory . -f infrastructure/docker/docker-compose.dev.yml up --build`

## Coding conventions
- Use TypeScript strictly on the client — avoid `any`, prefer explicit types/interfaces.
- Keep Nest controllers in `src/backend/src/modules` thin — push business logic into services and repositories rather than inline in controllers.
- Match existing file/folder naming conventions already used in `src/frontend` and `src/backend` rather than introducing new patterns.

## Security-sensitive areas — flag issues here first
- **Supabase keys**: flag any use of the service-role key in client-facing code — it should only ever be used server-side. The anon/public key is fine in the client.
- **Database queries**: all Postgres queries must be parameterized. Flag any string-concatenated or template-literal SQL as a potential injection risk.
- **Row-level security (RLS)**: if Supabase RLS policies are relevant to a change, flag any query pattern that looks like it assumes RLS is enforced when it may not be (or vice versa).
- **Input validation**: flag any API route or form accepting user input (recipe submissions, comments, blog posts) that lacks validation or sanitization, especially for any rendered HTML/markdown content (XSS risk).
- **Secrets**: flag any hardcoded Supabase URLs, keys, or JWT secrets committed directly in code — these should only come from environment variables.

## What NOT to flag
- Minor styling preferences that don't affect functionality.
- Formatting-only differences already handled by existing lint/format tooling.

## Notes for reviewers (human or Copilot)
- This is a solo-maintained personal/portfolio project — prioritize correctness, security, and clarity over enterprise-scale patterns.
- Note: this repo's README currently has an inconsistency (tech stack table says PostgreSQL, setup instructions mention MySQL/`recipes.sql`) — treat PostgreSQL/Supabase as the source of truth per actual project usage, and consider fixing the README doc as a housekeeping item.
