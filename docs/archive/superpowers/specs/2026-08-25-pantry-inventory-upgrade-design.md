# Pantry Inventory Upgrade Design

## Status

Approved direction for implementation planning.

## Goal

Upgrade the pantry from a binary ingredient checklist into an owner-scoped inventory that records a usable quantity and unit, then connects that stock to cooking completion.

## Product behavior

1. Pantry entries require a name, quantity, and supported unit for new or edited stock. Existing legacy rows remain readable until the user supplies quantity and unit.
2. Supported units are grams, kilograms, milliliters, liters, teaspoons, tablespoons, cups, and pieces. Compatible units can be converted for comparison and deduction.
3. Recipe ingredients used by inventory must have a positive numeric quantity and supported unit. Ambiguous values such as “a little” are rejected for published recipes and seeded data.
4. The selected cooking servings scale every recipe ingredient requirement. For example, a recipe quantity of 500 g for two base servings requires 1,000 g for four servings.
5. On cooking completion, the server calculates stock requirements inside one transaction. If stock is sufficient, it deducts the required quantities and records ingredient usage.
6. If stock is insufficient, completion pauses for confirmation and shows available, required, and missing quantities for each shortage.
7. “Continue anyway” completes the cooking session, deducts only the available quantity, and records the missing quantity in the ingredient usage log. It does not add anything to Shopping list.
8. “Stop and add to shopping list” leaves Pantry and cooking history unchanged, adds each missing quantity to Shopping list, and keeps the cooking session resumable.
9. The server enforces ownership for Pantry, cooking sessions, history, usage logs, and Shopping list rows. Repeated confirmation requests are safe because completion and deduction happen transactionally.
10. Pantry-driven suggestions preserve legacy available rows with a null quantity, while numeric cooking requirements only use entries marked available with a positive quantity. Legacy rows remain visible for manual correction but cannot satisfy numeric cooking requirements.

## Data model and API

Add an additive migration:

```prisma
quantity  Decimal?  @db.Decimal(12, 3)
unit      String?   @db.VarChar(20)
```

Add `CookingIngredientUsage` with the history, user, recipe ingredient position/name, required quantity/unit, deducted quantity, missing quantity, and optional Pantry item reference. Keep quantity nullable on `PantryItem` so old rows survive migration; new UI writes both quantity and unit.

Extend the Pantry DTOs and response contracts with quantity/unit. Extend cooking completion with an optional action: `complete` or `shopping`. A completion request without an action performs the stock check and returns a shortage confirmation error when needed.

## Validation and failure behavior

- Quantity is null for legacy rows or a non-negative decimal up to 1,000,000; cooking requirements must be positive.
- Quantity and unit are an atomic pair when supplied. Units are normalized against the supported unit list.
- A published recipe cannot be created or published with missing/ambiguous ingredient quantities.
- An invalid or legacy-only recipe cannot be completed through inventory; the user receives an actionable validation error.
- Unit conversion only occurs between compatible mass, volume, or count units. Incompatible units are treated as unavailable rather than guessed.
- All Pantry and completion operations use the authenticated user ID and preserve unrelated users’ data.

## Testing and acceptance criteria

- Migration validation proves old Pantry rows remain readable with null quantity/unit.
- Backend tests cover quantity/unit validation, servings scaling, unit conversion, shortage calculation, transactional completion, partial deduction, usage logging, Shopping list handoff, and ownership.
- Frontend tests cover adding/editing stock, displaying quantities, completion shortage confirmation, both user choices, and the resumable-session behavior.
- Recipe validation tests cover rejection of unquantified values such as “a little”.

## Out of scope

Barcode scanning, OCR, expiry tracking, grocery pricing, push reminders, automatic replenishment, and allergen inference.
