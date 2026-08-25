# Pantry Inventory Upgrade Design

## Status

Approved direction for implementation planning.

## Goal

Upgrade the pantry from a binary ingredient checklist into an optional, owner-scoped inventory that can record quantity, unit, and expiry while preserving the current simple availability workflow.

## Current context

- `PantryItem` currently stores `name` and `have` only.
- The frontend supports add, toggle available/needed, delete, loading, empty, and error states.
- Personalized home feed and pantry suggestions already use available pantry names for conservative text matching.
- Structured recipe ingredients already expose quantity/unit where available.

## Product behavior

1. Keep `name` and `have` backward-compatible. Existing items remain valid after migration.
2. Add optional `quantity`, `unit`, and `expiresOn` fields. Quantity is a non-negative decimal; unit is a short user-entered label such as `kg`, `bottle`, or `pieces`.
3. Allow users to add and edit pantry items in a compact form. Name is required; quantity, unit, and expiry are optional.
4. Display status groups: available, expiring within seven days, expired, and needed. Expired items are not considered available for recipe matching.
5. Allow users to mark an item as needed without deleting its quantity/history. Keep the current checkbox behavior.
6. Show a clear “Use in shopping list” action for needed or expired items; this adds a shopping-list line without silently removing the pantry item.
7. Personalized feed and pantry-match queries only match `have = true` items whose expiry is null or today/future. No quantity deduction occurs automatically.
8. On mobile, the item editor is a labelled dialog or inline form with touch targets of at least 44px.

## Data model and API

Add an additive migration and Prisma fields:

```prisma
quantity  Decimal?  @db.Decimal(12, 3)
unit      String?   @db.VarChar(64)
expiresOn DateTime? @map("expires_on") @db.Date
```

The existing `users/me/pantry` routes remain the API boundary. Extend `CreatePantryItemDto`, `UpdatePantryItemDto`, and response contracts. Validation rules:

- `quantity` is null or `0 <= quantity <= 1000000`.
- `unit` is null or trimmed length is 1–64.
- `expiresOn` is null or an ISO date in `YYYY-MM-DD` form.
- Names remain trimmed and 1–255 characters.

Update the repository projections and the home-feed pantry predicate. Add a small shopping-list mutation helper that creates a line using the pantry display name and optional quantity/unit; ownership remains enforced by the existing shopping-list module.

## Error and security behavior

- Every read and mutation is scoped to the authenticated JWT user.
- Invalid quantity, unit, or date returns field-level `400` validation errors.
- Missing or foreign pantry IDs return the existing not-found shape.
- Expired state is derived from the server date, not trusted from the client.
- The UI never presents an expired item as a safe ingredient or allergen-free claim.

## Testing and acceptance criteria

- Migration validation proves old pantry rows remain readable with null optional fields.
- Backend tests cover create/update validation, owner isolation, expired filtering for matching, and shopping-list handoff.
- Frontend tests cover add/edit/toggle/delete, status grouping, date and quantity validation, loading/error/empty states, and accessible dialog labels.
- Home-feed tests prove expired pantry items do not influence pantry matches.
- Playwright covers adding an item with quantity/expiry, editing it, marking it needed, and sending it to the shopping list on desktop and mobile.
- Axe and keyboard checks cover the pantry editor and status controls.

## Out of scope

- Barcode scanning, OCR, automatic quantity deduction, unit conversion, grocery pricing, push reminders, or medical/allergen inference.
