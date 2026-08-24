-- Extend the planning metadata tables with fields used by the lifecycle MVP.
-- The preceding planning migrations own recipe_ingredients, recipe_nutrition,
-- and recipe_allergens; this migration deliberately alters those tables instead
-- of creating competing copies.

ALTER TABLE "recipe_ingredients"
    ADD COLUMN IF NOT EXISTS "quantity_text" VARCHAR(64),
    ADD COLUMN IF NOT EXISTS "unit_text" VARCHAR(64),
    ADD COLUMN IF NOT EXISTS "preparation" VARCHAR(255),
    ADD COLUMN IF NOT EXISTS "original_text" TEXT;

ALTER TABLE "recipe_nutrition"
    ADD COLUMN IF NOT EXISTS "servings" INTEGER,
    ALTER COLUMN "calories_per_serving" DROP NOT NULL;

ALTER TABLE "recipe_ingredients"
    ADD CONSTRAINT "recipe_ingredients_name_check"
        CHECK (length(btrim("name")) > 0);

CREATE INDEX IF NOT EXISTS "recipe_ingredients_recipe_position_idx"
    ON "recipe_ingredients" ("recipe_id", "position");
