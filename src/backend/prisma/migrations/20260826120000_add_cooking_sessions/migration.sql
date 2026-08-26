CREATE TABLE "cooking_sessions" (
    "session_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "meal_plan_item_id" INTEGER,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paused_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cooking_sessions_pkey" PRIMARY KEY ("session_id"),
    CONSTRAINT "cooking_sessions_user_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE,
    CONSTRAINT "cooking_sessions_recipe_fk" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE CASCADE,
    CONSTRAINT "cooking_sessions_meal_plan_item_fk" FOREIGN KEY ("meal_plan_item_id") REFERENCES "meal_plan_items"("item_id") ON DELETE SET NULL,
    CONSTRAINT "cooking_sessions_servings_check" CHECK ("servings" BETWEEN 1 AND 24),
    CONSTRAINT "cooking_sessions_step_check" CHECK ("current_step" >= 0),
    CONSTRAINT "cooking_sessions_status_check" CHECK ("status" IN ('active', 'paused', 'completed', 'abandoned')),
    CONSTRAINT "cooking_sessions_completion_check" CHECK ("completed_at" IS NULL OR "completed_at" >= "started_at")
);

CREATE INDEX "cooking_sessions_user_status_updated_idx"
ON "cooking_sessions" ("user_id", "status", "updated_at" DESC);

CREATE INDEX "cooking_sessions_user_recipe_status_idx"
ON "cooking_sessions" ("user_id", "recipe_id", "status");

CREATE UNIQUE INDEX "cooking_sessions_one_active_per_user_recipe_idx"
ON "cooking_sessions" ("user_id", "recipe_id")
WHERE "status" IN ('active', 'paused');
