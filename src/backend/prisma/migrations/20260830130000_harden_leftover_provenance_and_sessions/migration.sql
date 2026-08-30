-- Allow a user to cook two different planned occurrences of the same recipe.
-- Unplanned cooking keeps the existing one-active-session-per-recipe behavior.
DROP INDEX IF EXISTS "cooking_sessions_one_active_per_user_recipe_idx";
CREATE UNIQUE INDEX "cooking_sessions_one_active_per_unplanned_recipe_idx"
ON "cooking_sessions" ("user_id", "recipe_id")
WHERE "meal_plan_item_id" IS NULL AND "status" IN ('active', 'paused');

-- Keep the origin of a history entry so a consumed leftover cannot be saved as
-- a new batch again. Existing history rows are ordinary recipe cooks.
ALTER TABLE "cooking_history"
    ADD COLUMN "source_type" VARCHAR(16) NOT NULL DEFAULT 'recipe',
    ADD COLUMN "leftover_batch_id" INTEGER;

ALTER TABLE "cooking_history"
    ADD CONSTRAINT "cooking_history_source_check"
      CHECK ("source_type" IN ('recipe', 'leftover')),
    ADD CONSTRAINT "cooking_history_source_consistency_check"
      CHECK (("source_type" = 'leftover' AND "leftover_batch_id" IS NOT NULL)
        OR ("source_type" = 'recipe' AND "leftover_batch_id" IS NULL)),
    ADD CONSTRAINT "cooking_history_leftover_fk"
      FOREIGN KEY ("leftover_batch_id") REFERENCES "leftover_batches"("leftover_id") ON DELETE RESTRICT;

CREATE INDEX "cooking_history_leftover_batch_idx"
ON "cooking_history" ("leftover_batch_id");

-- A planned meal occurrence can be completed only once, including when
-- multiple members of a household start it at the same time.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "cooking_history"
    WHERE "meal_plan_item_id" IS NOT NULL
    GROUP BY "meal_plan_item_id"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION USING
      MESSAGE = 'Cannot enforce one cooking history row per meal-plan item.',
      DETAIL = 'Existing duplicate cooking history rows must be resolved before this migration can continue.',
      HINT = 'Review duplicate meal_plan_item_id groups and retain the authoritative history row, then rerun the migration.';
  END IF;
END $$;

CREATE UNIQUE INDEX "cooking_history_one_per_plan_item_idx"
ON "cooking_history" ("meal_plan_item_id")
WHERE "meal_plan_item_id" IS NOT NULL;
