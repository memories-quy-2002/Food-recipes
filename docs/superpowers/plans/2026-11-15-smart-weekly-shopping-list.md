# Smart Weekly Shopping List — Implementation Plan

> Use Superpowers executing-plans, test-driven-development, requesting-code-review, and verification-before-completion.

**Goal:** Aggregate weekly meal ingredients, subtract pantry once, preview changes, and require explicit confirmation.
**Architecture:** NestJS Planning module, PlanningRepositoryPort, existing pantry inventory utility, a pure aggregation helper, personal/household controllers, React Shopping List TanStack Query.
**Constraints:** NestJS 11, pnpm 11.18, React 19, no database migration.

## Task 1 — Pure calculation
1. Add failing Jest tests for repeated recipes, serving scaling, compatible units, pantry subtraction once, text-only ingredients, and existing shopping items.
2. Run RED; implement minimal pure calculator; run GREEN.

## Task 2 — Backend API
1. Add a dedicated weekly shopping service that loads an owned plan, calculates preview, and hashes the snapshot.
2. Implement preview/confirm routes for personal and household scopes. Confirm recalculates and rejects a stale preview.
3. Add service/controller authorization and no-write tests.

## Task 3 — Frontend
1. Define typed API/React Query mutations.
2. Replace direct import with Preview → Confirm / Cancel UI, missing quantity and needs-details states.
3. Test interaction, errors, and cache refresh.

## Task 4 — Quality gate and PR
Run backend checks/build, frontend checks/build, Playwright as available; review diff and create a PR. Do not merge without successful checks.
