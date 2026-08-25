CREATE TABLE "cooking_history" (
    "history_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "meal_plan_item_id" INTEGER,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "started_at" TIMESTAMP(6) NOT NULL,
    "completed_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cooking_history_pkey" PRIMARY KEY ("history_id"),
    CONSTRAINT "cooking_history_user_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE,
    CONSTRAINT "cooking_history_recipe_fk" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE CASCADE,
    CONSTRAINT "cooking_history_meal_plan_item_fk" FOREIGN KEY ("meal_plan_item_id") REFERENCES "meal_plan_items"("item_id") ON DELETE SET NULL,
    CONSTRAINT "cooking_history_servings_check" CHECK ("servings" BETWEEN 1 AND 24),
    CONSTRAINT "cooking_history_time_order_check" CHECK ("completed_at" >= "started_at")
);

CREATE INDEX "cooking_history_user_completed_idx" ON "cooking_history" ("user_id", "completed_at" DESC, "history_id" DESC);
CREATE INDEX "cooking_history_user_recipe_idx" ON "cooking_history" ("user_id", "recipe_id");
