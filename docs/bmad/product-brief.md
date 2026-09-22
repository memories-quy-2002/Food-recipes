# Food Recipes product brief

Status: current baseline
Last reviewed: 2026-09-22

This brief records durable product intent for planning. It is not an inventory
of every implementation detail; use the code and linked current guides for
that evidence.

## Product outcome

Help a person move from finding a recipe to planning, shopping, cooking,
and remembering what worked. Public discovery is open to guests; each signed-in
account has a private personal kitchen.

## Users

- Guests discover public recipes and can preview recipe imports where the
  current flow allows.
- Signed-in users manage their account, authored recipes, saved content,
  meal plans, shopping, pantry, cooking history, and journals.

## Product principles

- Preserve continuity across the kitchen journey: discovery, planning,
  shopping, pantry, cooking, and reflection should use consistent data and
  clear handoffs.
- Keep the public recipe experience distinct from private personal
  account data. The backend decides resource ownership; the UI reflects that
  boundary.
- Protect private user data. Keep access tokens in frontend memory and use the
  current refresh-cookie contract.
- Keep states understandable and recoverable: loading, empty, validation,
  permission, failure, and retry states matter where they apply.
- Extend existing feature boundaries and interaction patterns. Prefer a
  focused change over broad rewrites or new dependencies without a demonstrated
  need.
- Treat planned behavior as planned until current code and verification
  evidence support it.

## Current product scope

The repository currently covers:

- Public recipe discovery, search, filters, details, ratings, and reviews
- Accounts, profile, preferences, and notifications
- Recipe authoring, publishing, archiving, restoration, and URL import to a
  private draft
- Saved recipes, collections, and private notes
- Meal plans, templates, recurring rules, shopping lists, and pantry inventory
- Cooking sessions, history, leftovers, and private journals

See [current user journeys](../frontend/current-user-journeys.md) and the
[current API contract](../backend/current-api-contract.md) for the implemented
behavior. The [roadmap](../roadmap.md) separates completed work from remaining
verified rollout work.

## Technical and operational constraints

- Frontend and backend are independent pnpm packages with separate manifests
  and lockfiles. There is no root pnpm workspace.
- The frontend is React, TypeScript, and Vite. Domain behavior belongs in
  feature folders; shared UI and API code belongs in shared folders when
  reuse is real.
- The backend is a NestJS REST API using Prisma and PostgreSQL. Controllers
  handle HTTP, services coordinate domain rules, and repositories own database
  access.
- Preserve /api/v1 contracts, refresh-cookie behavior, compatibility paths,
  and personal ownership checks unless the accepted product outcome
  intentionally changes them. Do not reintroduce household or group kitchen
  workflows. Keep legacy group data until a safe retention plan is approved.
- CI uses disposable PostgreSQL for migration and seed verification.
  Production database operations remain operator-controlled as described in
  [CI/CD operations](../ci-cd.md).
- Never put secrets, private user data, production credentials, or private
  service URLs in prompts or planning documents.

## Deferred work and decisions

Use the [roadmap](../roadmap.md) for verified open rollout work. Add a focused
PRD for a new unresolved product decision; record an architecture decision in
the Wiki only after it is confirmed. Do not infer product intent from an
archived proposal.