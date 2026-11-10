# Saved Recipes Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make Saved scale with users' libraries while preserving existing API callers and shareable search/sort/page state.

**Architecture:** Add opt-in server pagination to the existing user-owned wishlist endpoint. Requests without pagination parameters keep the current full-list response for existing callers; paginated requests use page/limit/search/sort and return result metadata. The Saved page reads these values from the URL and keeps collections on their existing list behavior.

**Tech Stack:** React, React Router, Vitest, NestJS, class-validator, PostgreSQL, Prisma raw SQL, Jest, Playwright.

**Spec:** `docs/superpowers/plans/2026-11-09-food-recipes-platform-roadmap.md` (M2 Discover/Saved; preserve API compatibility and user-owned data).

## Global Constraints

- Keep the existing React/Vite and NestJS/PostgreSQL architecture; add no dependencies.
- Enforce user ownership in the backend.
- Preserve callers that request `/users/me/wishlist` without pagination parameters.
- Keep filters in URL state, return focus and keyboard access, and support mobile layouts.
- Use stable ordering and bounded page sizes; never interpolate user input into SQL identifiers.

## Review Focus

- Removing an item from the last page must navigate to the newly valid final page.
- Search with no matches must report an empty state while retaining URL state.
- Out-of-range and malformed page/limit values must be bounded or rejected consistently.
- Existing planner consumers without pagination parameters must still receive the full saved list.
- Sort order must remain deterministic when rating or saved timestamps tie.

---

### Task 1: Paginated, filtered wishlist API

**Files:**
- Create: `src/backend/src/modules/wishlist/dto/wishlist-query.dto.ts`
- Modify: `src/backend/src/modules/wishlist/wishlist.repository.ts`
- Modify: `src/backend/src/modules/wishlist/wishlist.service.ts`
- Modify: `src/backend/src/modules/wishlist/wishlist.controller.ts`
- Modify: `src/backend/src/common/swagger/response.schemas.ts`
- Test: wishlist repository/service/controller/Jest API tests.

**Interfaces:**
- Consumes: the current no-query `list(userId)` contract.
- Produces: `list(userId, query?)`; paginated query returns `wishlist` plus `pagination: { page, limit, total, totalPages, hasNext }`.

- [x] Write tests proving bounded page results, stable search/sort, pagination metadata, and unchanged no-query behavior.
- [x] Run the focused Jest specs and confirm the new paginated expectations fail before implementation.
- [x] Implement validated optional `page`, `limit`, `search`, and `sort` query fields; use parameterized SQL and owner-scoped queries.
- [x] Re-run focused wishlist tests, then backend check and API contract suite.

### Task 2: URL-backed Saved pagination

**Files:**
- Modify: `src/frontend/features/wishlist/Wishlist.tsx`
- Modify: `src/frontend/features/wishlist/Wishlist.css`
- Modify: `src/frontend/e2e/saved-collection-journey.spec.js`
- Test: Saved component behavior and mock/real-stack journeys.

**Interfaces:**
- Consumes: Task 1 paginated response; existing collection API and URL `collectionId`.
- Produces: stable `/wishlist?page=&search=&sort=` state for the All saved view; collection routes retain current behavior.

- [ ] Add tests for query parameters, result counts, empty state, pagination controls, and remove-on-last-page behavior.
- [ ] Run the focused frontend tests and confirm the new pagination expectations fail before implementation.
- [ ] Add keyboard-accessible Previous/Next and page status UI in existing Wishlist styling; reset page on search/sort changes and preserve collection state.
- [ ] Run focused component and Playwright tests at mobile and desktop viewports.

### Task 3: Completion verification

- [ ] Run `pnpm check` and `pnpm build` in `src/frontend`.
- [ ] Run `pnpm check`, `pnpm test:e2e`, and `pnpm prisma:validate` in `src/backend`.
- [ ] Run the full frontend mock E2E and configured real-stack Saved acceptance against isolated PostgreSQL when available.
- [ ] Review the complete diff, update the roadmap progress, and commit as `feat(saved): paginate saved recipes`.
