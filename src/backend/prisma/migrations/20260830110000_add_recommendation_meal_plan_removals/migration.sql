CREATE TABLE "recommendation_meal_plan_removals" (
    "removal_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "removed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recommendation_meal_plan_removals_pkey" PRIMARY KEY ("removal_id"),
    CONSTRAINT "recommendation_meal_plan_removal_user_recipe_key" UNIQUE ("user_id", "recipe_id"),
    CONSTRAINT "recommendation_meal_plan_removal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE,
    CONSTRAINT "recommendation_meal_plan_removal_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE CASCADE
);

CREATE INDEX "recommendation_meal_plan_removal_user_removed_idx" ON "recommendation_meal_plan_removals"("user_id", "removed_at");
