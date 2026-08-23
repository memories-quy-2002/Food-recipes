CREATE TABLE "meal_plans" (
    "plan_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("plan_id"),
    CONSTRAINT "meal_plans_user_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE,
    CONSTRAINT "meal_plans_date_range_check" CHECK ("end_date" >= "start_date" AND "end_date" <= "start_date" + 30)
);

CREATE TABLE "meal_plan_items" (
    "item_id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "planned_date" DATE NOT NULL,
    "slot" VARCHAR(16) NOT NULL,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meal_plan_items_pkey" PRIMARY KEY ("item_id"),
    CONSTRAINT "meal_plan_items_plan_fk" FOREIGN KEY ("plan_id") REFERENCES "meal_plans"("plan_id") ON DELETE CASCADE,
    CONSTRAINT "meal_plan_items_recipe_fk" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE CASCADE,
    CONSTRAINT "meal_plan_items_slot_check" CHECK ("slot" IN ('breakfast', 'lunch', 'dinner', 'snack')),
    CONSTRAINT "meal_plan_items_servings_check" CHECK ("servings" BETWEEN 1 AND 24)
);

CREATE INDEX "meal_plan_items_plan_date_idx" ON "meal_plan_items" ("plan_id", "planned_date", "slot");

CREATE TABLE "shopping_list_items" (
    "item_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "quantity" VARCHAR(80),
    "source_recipe_id" INTEGER,
    "checked" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shopping_list_items_pkey" PRIMARY KEY ("item_id"),
    CONSTRAINT "shopping_list_items_user_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE,
    CONSTRAINT "shopping_list_items_recipe_fk" FOREIGN KEY ("source_recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE SET NULL
);

CREATE INDEX "shopping_list_user_checked_idx" ON "shopping_list_items" ("user_id", "checked", "created_at");
