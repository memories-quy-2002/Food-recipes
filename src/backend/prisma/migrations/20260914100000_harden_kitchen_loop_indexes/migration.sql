-- P0 E: align planning, shopping, and pantry reads with personal/household scope.
CREATE INDEX "meal_plans_user_start_end_idx"
    ON "meal_plans" ("user_id", "start_date", "end_date");

CREATE INDEX "meal_plans_household_start_end_idx"
    ON "meal_plans" ("household_id", "start_date", "end_date");

-- The unique plan/date/slot index supersedes the original non-unique copy.
DROP INDEX IF EXISTS "meal_plan_items_plan_date_idx";

CREATE INDEX "pantry_items_household_have_idx"
    ON "pantry_items" ("household_id", "have");

CREATE INDEX "shopping_list_household_checked_idx"
    ON "shopping_list_items" ("household_id", "checked", "created_at");

-- Active shopping items are idempotent by scope, normalized label, and quantity.
-- Checked rows remain re-addable after they have been purchased or cleared.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "shopping_list_items"
    WHERE "checked" = FALSE AND "user_id" IS NOT NULL
    GROUP BY "user_id", LOWER(BTRIM("label")), COALESCE(BTRIM("quantity"), '')
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION USING
      MESSAGE = 'Cannot enforce unique unchecked personal shopping items.',
      DETAIL = 'Existing duplicate shopping_list_items rows must be resolved before this migration can continue.',
      HINT = 'Keep one unchecked row for each user, normalized label, and quantity, then rerun the migration.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "shopping_list_items"
    WHERE "checked" = FALSE AND "household_id" IS NOT NULL
    GROUP BY "household_id", LOWER(BTRIM("label")), COALESCE(BTRIM("quantity"), '')
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION USING
      MESSAGE = 'Cannot enforce unique unchecked household shopping items.',
      DETAIL = 'Existing duplicate shopping_list_items rows must be resolved before this migration can continue.',
      HINT = 'Keep one unchecked row for each household, normalized label, and quantity, then rerun the migration.';
  END IF;
END $$;

CREATE UNIQUE INDEX "shopping_list_user_unchecked_label_quantity_key"
    ON "shopping_list_items" ("user_id", LOWER(BTRIM("label")), COALESCE(BTRIM("quantity"), ''))
    WHERE "user_id" IS NOT NULL AND "checked" = FALSE;

CREATE UNIQUE INDEX "shopping_list_household_unchecked_label_quantity_key"
    ON "shopping_list_items" ("household_id", LOWER(BTRIM("label")), COALESCE(BTRIM("quantity"), ''))
    WHERE "household_id" IS NOT NULL AND "checked" = FALSE;
