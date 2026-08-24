-- Additive recipe structure and lifecycle extension.

ALTER TABLE "recipes"
    ADD COLUMN "status" VARCHAR(16) NOT NULL DEFAULT 'published',
    ADD COLUMN "published_at" TIMESTAMP(6),
    ADD COLUMN "archived_at" TIMESTAMP(6),
    ADD COLUMN "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Drafts may be incomplete. Published records are validated by the API before
-- the status transition and retain the existing positive duration checks.
ALTER TABLE "recipes"
    ALTER COLUMN "recipe_name" DROP NOT NULL,
    ALTER COLUMN "meal_id" DROP NOT NULL,
    ALTER COLUMN "category_id" DROP NOT NULL,
    ALTER COLUMN "prep_time" DROP NOT NULL,
    ALTER COLUMN "cook_time" DROP NOT NULL,
    ALTER COLUMN "prep_time_minutes" DROP NOT NULL,
    ALTER COLUMN "cook_time_minutes" DROP NOT NULL;

ALTER TABLE "recipes"
    DROP CONSTRAINT IF EXISTS "prep_time_minutes_positive_check",
    DROP CONSTRAINT IF EXISTS "cook_time_minutes_positive_check",
    ADD CONSTRAINT "recipes_status_check"
        CHECK ("status" IN ('draft', 'published', 'archived')),
    ADD CONSTRAINT "prep_time_minutes_positive_check"
        CHECK ("prep_time_minutes" IS NULL OR "prep_time_minutes" > 0),
    ADD CONSTRAINT "cook_time_minutes_positive_check"
        CHECK ("cook_time_minutes" IS NULL OR "cook_time_minutes" > 0);

UPDATE "recipes"
SET
    "status" = 'published',
    "published_at" = COALESCE("date_added", CURRENT_TIMESTAMP),
    "updated_at" = COALESCE("date_added", CURRENT_TIMESTAMP);

CREATE INDEX "recipes_status_idx" ON "recipes" ("status", "recipe_id");
CREATE INDEX "recipes_user_status_idx" ON "recipes" ("user_id", "status", "recipe_id");

CREATE TABLE "recipe_ingredients" (
    "recipe_ingredient_id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "quantity" DECIMAL(12,3),
    "quantity_text" VARCHAR(64),
    "unit" VARCHAR(64),
    "name" VARCHAR(255) NOT NULL,
    "preparation" VARCHAR(255),
    "original_text" TEXT,
    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("recipe_ingredient_id"),
    CONSTRAINT "recipe_ingredients_recipe_fk"
        FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE CASCADE,
    CONSTRAINT "recipe_ingredients_position_check" CHECK ("position" > 0),
    CONSTRAINT "recipe_ingredients_quantity_check"
        CHECK ("quantity" IS NULL OR "quantity" >= 0),
    CONSTRAINT "recipe_ingredients_name_check" CHECK (length(btrim("name")) > 0),
    CONSTRAINT "recipe_ingredients_recipe_position_key" UNIQUE ("recipe_id", "position")
);

CREATE INDEX "recipe_ingredients_recipe_position_idx"
    ON "recipe_ingredients" ("recipe_id", "position");

CREATE TABLE "recipe_nutrition" (
    "recipe_nutrition_id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "servings" INTEGER NOT NULL,
    "calories" DECIMAL(10,2),
    "protein" DECIMAL(10,2),
    "carbohydrates" DECIMAL(10,2),
    "fat" DECIMAL(10,2),
    "fiber" DECIMAL(10,2),
    "sugar" DECIMAL(10,2),
    "sodium" DECIMAL(10,2),
    CONSTRAINT "recipe_nutrition_pkey" PRIMARY KEY ("recipe_nutrition_id"),
    CONSTRAINT "recipe_nutrition_recipe_fk"
        FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE CASCADE,
    CONSTRAINT "recipe_nutrition_recipe_key" UNIQUE ("recipe_id"),
    CONSTRAINT "recipe_nutrition_servings_check" CHECK ("servings" > 0),
    CONSTRAINT "recipe_nutrition_values_check" CHECK (
        ("calories" IS NULL OR "calories" >= 0) AND
        ("protein" IS NULL OR "protein" >= 0) AND
        ("carbohydrates" IS NULL OR "carbohydrates" >= 0) AND
        ("fat" IS NULL OR "fat" >= 0) AND
        ("fiber" IS NULL OR "fiber" >= 0) AND
        ("sugar" IS NULL OR "sugar" >= 0) AND
        ("sodium" IS NULL OR "sodium" >= 0)
    )
);

CREATE TABLE "recipe_dietary_tags" (
    "recipe_dietary_tag_id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "tag" VARCHAR(64) NOT NULL,
    CONSTRAINT "recipe_dietary_tags_pkey" PRIMARY KEY ("recipe_dietary_tag_id"),
    CONSTRAINT "recipe_dietary_tags_recipe_fk"
        FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE CASCADE,
    CONSTRAINT "recipe_dietary_tags_tag_check" CHECK (length(btrim("tag")) > 0),
    CONSTRAINT "recipe_dietary_tags_recipe_tag_key" UNIQUE ("recipe_id", "tag")
);

CREATE INDEX "recipe_dietary_tags_recipe_idx" ON "recipe_dietary_tags" ("recipe_id");

CREATE TABLE "recipe_allergen_tags" (
    "recipe_allergen_tag_id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "tag" VARCHAR(64) NOT NULL,
    CONSTRAINT "recipe_allergen_tags_pkey" PRIMARY KEY ("recipe_allergen_tag_id"),
    CONSTRAINT "recipe_allergen_tags_recipe_fk"
        FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE CASCADE,
    CONSTRAINT "recipe_allergen_tags_tag_check" CHECK (length(btrim("tag")) > 0),
    CONSTRAINT "recipe_allergen_tags_recipe_tag_key" UNIQUE ("recipe_id", "tag")
);

CREATE INDEX "recipe_allergen_tags_recipe_idx" ON "recipe_allergen_tags" ("recipe_id");

-- Preserve every legacy array entry and order. Quantity/unit are intentionally
-- left NULL; no parsing or guessing is performed during the backfill.
INSERT INTO "recipe_ingredients" ("recipe_id", "position", "name", "original_text")
SELECT r."recipe_id", legacy."position", btrim(legacy."value"), legacy."value"
FROM "recipes" r
CROSS JOIN LATERAL unnest(COALESCE(r."ingredients", ARRAY[]::text[]))
    WITH ORDINALITY AS legacy("value", "position");
