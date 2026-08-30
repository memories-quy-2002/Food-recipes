CREATE TABLE "leftover_batches" (
    "leftover_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "household_id" INTEGER,
    "history_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "cooked_servings" INTEGER NOT NULL,
    "remaining_servings" INTEGER NOT NULL,
    "prepared_at" TIMESTAMP(6) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "leftover_batches_pkey" PRIMARY KEY ("leftover_id"),
    CONSTRAINT "leftover_batches_owner_check" CHECK (("user_id" IS NOT NULL AND "household_id" IS NULL) OR ("user_id" IS NULL AND "household_id" IS NOT NULL)),
    CONSTRAINT "leftover_batches_servings_check" CHECK ("cooked_servings" > 0 AND "remaining_servings" >= 0 AND "remaining_servings" <= "cooked_servings"),
    CONSTRAINT "leftover_batches_expiry_check" CHECK ("expires_at" > "prepared_at"),
    CONSTRAINT "leftover_batches_history_fk" FOREIGN KEY ("history_id") REFERENCES "cooking_history"("history_id") ON DELETE RESTRICT,
    CONSTRAINT "leftover_batches_recipe_fk" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "leftover_batches_history_key" ON "leftover_batches"("history_id");
CREATE INDEX "leftover_batches_user_available_idx" ON "leftover_batches"("user_id", "expires_at", "remaining_servings");
CREATE INDEX "leftover_batches_household_available_idx" ON "leftover_batches"("household_id", "expires_at", "remaining_servings");

ALTER TABLE "leftover_batches"
    ADD CONSTRAINT "leftover_batches_user_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE RESTRICT,
    ADD CONSTRAINT "leftover_batches_household_fk" FOREIGN KEY ("household_id") REFERENCES "households"("household_id") ON DELETE RESTRICT;
ALTER TABLE "meal_plan_items" ADD COLUMN "source_type" VARCHAR(16) NOT NULL DEFAULT 'recipe';
ALTER TABLE "meal_plan_items" ADD COLUMN "leftover_batch_id" INTEGER;
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_source_check" CHECK ("source_type" IN ('recipe', 'leftover', 'external'));
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_source_consistency_check" CHECK (("source_type" = 'leftover' AND "leftover_batch_id" IS NOT NULL) OR ("source_type" IN ('recipe', 'external') AND "leftover_batch_id" IS NULL));
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_leftover_fk" FOREIGN KEY ("leftover_batch_id") REFERENCES "leftover_batches"("leftover_id") ON DELETE RESTRICT;
CREATE INDEX "meal_plan_items_leftover_idx" ON "meal_plan_items"("leftover_batch_id");
ALTER TABLE "cooking_sessions" ADD COLUMN "source_type" VARCHAR(16) NOT NULL DEFAULT 'recipe';
ALTER TABLE "cooking_sessions" ADD COLUMN "leftover_batch_id" INTEGER;
ALTER TABLE "cooking_sessions" ADD COLUMN "household_id" INTEGER;
ALTER TABLE "cooking_sessions" ADD CONSTRAINT "cooking_sessions_source_check" CHECK ("source_type" IN ('recipe', 'leftover'));
ALTER TABLE "cooking_sessions" ADD CONSTRAINT "cooking_sessions_source_consistency_check" CHECK (("source_type" = 'leftover' AND "leftover_batch_id" IS NOT NULL) OR ("source_type" = 'recipe' AND "leftover_batch_id" IS NULL));
ALTER TABLE "cooking_sessions" ADD CONSTRAINT "cooking_sessions_leftover_fk" FOREIGN KEY ("leftover_batch_id") REFERENCES "leftover_batches"("leftover_id") ON DELETE RESTRICT;
ALTER TABLE "cooking_sessions" ADD CONSTRAINT "cooking_sessions_household_fk" FOREIGN KEY ("household_id") REFERENCES "households"("household_id") ON DELETE RESTRICT;

CREATE UNIQUE INDEX "cooking_sessions_active_plan_item_key"
    ON "cooking_sessions"("meal_plan_item_id")
    WHERE "meal_plan_item_id" IS NOT NULL AND "status" IN ('active', 'paused');
