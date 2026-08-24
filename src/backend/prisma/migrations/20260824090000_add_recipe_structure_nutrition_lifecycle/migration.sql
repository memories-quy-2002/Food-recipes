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
