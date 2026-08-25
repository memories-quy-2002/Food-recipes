# Pantry Inventory Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional quantity, unit, expiry, status grouping, and shopping-list handoff to the existing owner-scoped pantry.

**Architecture:** Extend `PantryItem` additively and keep `have` as the compatibility availability flag. The NestJS pantry service validates and owns all fields; the frontend uses the existing TanStack Query pantry hooks and shopping-list mutation. Feed matching excludes expired unavailable items without attempting quantity deduction.

**Tech Stack:** Prisma/PostgreSQL, NestJS, class-validator, React/TSX, TanStack Query, Axios, Vitest/Testing Library, Jest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-25-pantry-inventory-upgrade-design.md`

## Global Constraints

- Work only on `feature/recipe-workflows`; do not commit to `master`.
- Use an additive migration; never reset, delete, or rewrite existing pantry rows.
- Preserve current `name/have` API behavior and existing pantry-match semantics for non-expired items.
- Enforce user ownership from JWT on every read and mutation.
- Do not add barcode/OCR, unit conversion, auto-deduction, pricing, reminders, or allergen inference.
- Add loading, empty, error, validation, mobile, keyboard, focus-visible, and accessible status states.

---

### Task 1: Add the additive pantry schema and migration

**Files:**
- Modify: `src/backend/prisma/schema.prisma`
- Create: `src/backend/prisma/migrations/20260825120000_upgrade_pantry_inventory/migration.sql`
- Create: `src/backend/test/pantry-migration.validation.mjs`

**Interfaces:**
- Produces: `PantryItem.quantity`, `PantryItem.unit`, `PantryItem.expiresOn`.
- Preserves: existing `pantry_id`, `user_id`, `name`, `have`, `updated_at` columns and indexes.

- [ ] **Step 1: Write the failing migration validation**

```js
assert.match(migration, /ADD COLUMN quantity/);
assert.match(migration, /ADD COLUMN unit/);
assert.match(migration, /ADD COLUMN expires_on/);
assert.doesNotMatch(migration, /DROP COLUMN name|DROP COLUMN have/);
```

- [ ] **Step 2: Run the validation to verify failure**

```powershell
cd src/backend
corepack pnpm@11.18.0 exec node test/pantry-migration.validation.mjs
```

Expected: FAIL because the migration and validation file do not exist.

- [ ] **Step 3: Implement the schema and SQL**

Use nullable columns so old rows remain valid:

```sql
ALTER TABLE pantry_items
  ADD COLUMN quantity NUMERIC(12, 3),
  ADD COLUMN unit VARCHAR(64),
  ADD COLUMN expires_on DATE;

ALTER TABLE pantry_items
  ADD CONSTRAINT pantry_items_quantity_check
  CHECK (quantity IS NULL OR (quantity >= 0 AND quantity <= 1000000));
```

Add an index supporting owner/status/expiry reads. Do not make the migration depend on a seed or production URL.

- [ ] **Step 4: Run Prisma validation against the existing database contract**

```powershell
corepack pnpm@11.18.0 prisma:validate
corepack pnpm@11.18.0 exec node test/pantry-migration.validation.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit the migration**

```powershell
git add src/backend/prisma/schema.prisma src/backend/prisma/migrations/20260825120000_upgrade_pantry_inventory/migration.sql src/backend/test/prisma-baseline.validation.mjs
git commit -m "feat(pantry): add inventory quantity and expiry"
```

### Task 2: Extend pantry DTOs, repository, service, and response contracts

**Files:**
- Modify: `src/backend/src/modules/pantry/dto/create-pantry-item.dto.ts`
- Modify: `src/backend/src/modules/pantry/dto/update-pantry-item.dto.ts`
- Modify: `src/backend/src/modules/pantry/pantry.repository.ts`
- Modify: `src/backend/src/modules/pantry/pantry.service.ts`
- Modify: `src/backend/src/modules/pantry/pantry.controller.ts`
- Modify: `src/backend/src/common/swagger/response.schemas.ts`
- Modify: `src/backend/src/modules/pantry/pantry.service.spec.ts`
- Create: `src/backend/src/modules/pantry/pantry.repository.spec.ts`

**Interfaces:**
- Consumes: `quantity?: number | null`, `unit?: string | null`, `expiresOn?: string | null`.
- Produces: snake_case response fields `quantity`, `unit`, `expires_on`, plus existing `pantry_id`, `name`, and `have`.

- [ ] **Step 1: Write failing validation and ownership tests**

Cover negative/over-limit quantity, blank/overlong unit, invalid date, create/update ownership, and nullable values.

- [ ] **Step 2: Run focused backend tests to verify failure**

```powershell
corepack pnpm@11.18.0 exec jest src/modules/pantry/pantry.service.spec.ts src/modules/pantry/pantry.repository.spec.ts --runInBand
```

Expected: FAIL because DTOs and projections do not contain the new fields.

- [ ] **Step 3: Implement validation and normalized persistence**

Use `@IsOptional`, `@IsNumber`, `@Min(0)`, `@Max(1000000)`, `@IsString`, `@MaxLength(64)`, and a strict ISO-date validator already used by the planning module or a small local DTO validator. Trim names/units in the service and map DB dates to `YYYY-MM-DD`.

- [ ] **Step 4: Implement the expired-availability predicate**

Use the server date in repository queries:

```sql
WHERE user_id = $userId
  AND have = TRUE
  AND (expires_on IS NULL OR expires_on >= CURRENT_DATE)
```

Keep list responses inclusive so users can see expired items and fix them.

- [ ] **Step 5: Run focused checks**

```powershell
corepack pnpm@11.18.0 exec jest src/modules/pantry --runInBand
corepack pnpm@11.18.0 exec tsc -p tsconfig.json --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit the backend pantry contract**

```powershell
git add src/backend/src/modules/pantry src/backend/src/common/swagger/response.schemas.ts
git commit -m "feat(pantry): validate inventory fields"
```

### Task 3: Update feed matching and shopping-list handoff

**Files:**
- Modify: `src/backend/src/modules/home-feed/home-feed.repository.ts`
- Modify: `src/backend/src/modules/home-feed/home-feed.repository.spec.ts`
- Modify: `src/frontend/features/pantry/api/pantryApi.ts`
- Modify: `src/frontend/features/pantry/api/pantryQueries.ts`
- Modify: `src/frontend/features/shopping/api/shoppingApi.ts`
- Modify: `src/frontend/features/shopping/api/shoppingQueries.ts`
- Create: `src/frontend/features/pantry/api/pantryDisplay.ts`
- Create: `src/frontend/features/pantry/api/pantryDisplay.test.ts`

- [ ] **Step 1: Add failing expired-match and handoff tests**

Assert expired pantry rows do not appear in pantry-driven home-feed sections and a handoff sends one shopping line with the optional display quantity/unit.

- [ ] **Step 2: Run focused tests to verify failure**

```powershell
cd src/backend
corepack pnpm@11.18.0 exec jest src/modules/home-feed/home-feed.repository.spec.ts --runInBand
cd ../frontend
pnpm exec vitest run features/pantry/api/pantryDisplay.test.ts features/shopping/api/shoppingApi.test.ts
```

Expected: FAIL until the expiry predicate and helper exist.

- [ ] **Step 3: Implement the conservative matching and handoff**

Keep matching name-based and explicit. Build shopping quantity as display text only; do not convert units or deduct stock:

```ts
const quantityLabel = [item.quantity, item.unit].filter(Boolean).join(' ');
await addShoppingItem({ label: item.name, quantity: quantityLabel || undefined });
```

- [ ] **Step 4: Run backend/frontend focused checks**

```powershell
cd src/backend
corepack pnpm@11.18.0 exec jest src/modules/home-feed --runInBand
cd ../frontend
pnpm exec vitest run features/pantry/api features/shopping/api
```

Expected: PASS.

- [ ] **Step 5: Commit feed and handoff behavior**

```powershell
git add src/backend/src/modules/home-feed src/frontend/features/pantry/api src/frontend/features/shopping/api
git commit -m "feat(pantry): connect inventory to matching and shopping"
```

### Task 4: Build the upgraded pantry UI

**Files:**
- Create: `src/frontend/features/pantry/PantryItemForm.tsx`
- Create: `src/frontend/features/pantry/PantryItemForm.test.tsx`
- Modify: `src/frontend/features/pantry/PantryPage.tsx`
- Modify: `src/frontend/features/pantry/PantryPage.test.tsx`

- [ ] **Step 1: Write failing UI tests** for add/edit quantity/unit/expiry, status grouping, expired copy, toggle, delete, shopping handoff, empty/error/loading states, and dialog keyboard close.
- [ ] **Step 2: Run focused tests to verify failure**

```powershell
cd src/frontend
pnpm exec vitest run features/pantry/PantryItemForm.test.tsx features/pantry/PantryPage.test.tsx
```

- [ ] **Step 3: Implement the form and status groups**

Use native date input, numeric quantity input, labelled unit input, and existing `Card`, `Input`, `Button`, and query mutations. Keep the simple checkbox available/needed action. Expiry status copy must be explicit: `Expired`, `Expires today`, `Expires in N days`, or `No expiry date`.

- [ ] **Step 4: Implement shopping handoff and accessible feedback**

Add a button per item where the handoff is meaningful, disable while pending, and announce success/error. Keep destructive delete confirmation consistent with existing pantry behavior.

- [ ] **Step 5: Run focused lint/typecheck/accessibility tests**

```powershell
pnpm exec vitest run features/pantry
pnpm exec eslint features/pantry
pnpm exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit the pantry UI**

```powershell
git add src/frontend/features/pantry
git commit -m "feat(pantry): add inventory management UI"
```

### Task 5: Verify pantry browser behavior

**Files:**
- Create: `src/frontend/e2e/pantry-inventory-journey.spec.js`

- [ ] **Step 1: Add mocked desktop/mobile journey** for add quantity/expiry, edit, toggle needed, handoff to shopping list, and expired status.
- [ ] **Step 2: Run it**

```powershell
pnpm test:e2e -- e2e/pantry-inventory-journey.spec.js
```

- [ ] **Step 3: Run package verification**

```powershell
cd src/backend; corepack pnpm@11.18.0 check; corepack pnpm@11.18.0 build
cd ../frontend; pnpm check; pnpm build
```

- [ ] **Step 4: Commit browser verification**

```powershell
git add src/frontend/e2e/pantry-inventory-journey.spec.js
git commit -m "test(pantry): cover inventory journey"
```
