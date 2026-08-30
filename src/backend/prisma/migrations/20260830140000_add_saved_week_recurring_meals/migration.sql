CREATE TABLE "meal_plan_templates" (
    "template_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meal_plan_templates_pkey" PRIMARY KEY ("template_id"),
    CONSTRAINT "meal_plan_templates_duration_check" CHECK ("duration_days" BETWEEN 1 AND 31),
    CONSTRAINT "meal_plan_templates_user_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE
);

CREATE INDEX "meal_plan_templates_user_created_idx" ON "meal_plan_templates" ("user_id", "created_at");

CREATE TABLE "meal_plan_template_items" (
    "template_item_id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "relative_day" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "slot" VARCHAR(16) NOT NULL,
    "servings" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "meal_plan_template_items_pkey" PRIMARY KEY ("template_item_id"),
    CONSTRAINT "meal_plan_template_items_day_check" CHECK ("relative_day" BETWEEN 0 AND 30),
    CONSTRAINT "meal_plan_template_items_slot_check" CHECK ("slot" IN ('breakfast', 'lunch', 'dinner', 'snack')),
    CONSTRAINT "meal_plan_template_items_servings_check" CHECK ("servings" BETWEEN 1 AND 24),
    CONSTRAINT "meal_plan_template_items_template_fk" FOREIGN KEY ("template_id") REFERENCES "meal_plan_templates"("template_id") ON DELETE CASCADE,
    CONSTRAINT "meal_plan_template_items_recipe_fk" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE CASCADE
);

CREATE INDEX "meal_plan_template_items_template_day_idx" ON "meal_plan_template_items" ("template_id", "relative_day");

-- A plan has one meal per date/slot. Fail early with remediation guidance if legacy data violates that invariant.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "meal_plan_items"
    GROUP BY "plan_id", "planned_date", "slot"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION USING
      MESSAGE = 'Cannot enforce one meal per plan date and slot.',
      DETAIL = 'Existing duplicate meal_plan_items rows must be resolved before this migration can continue.',
      HINT = 'Review duplicate (plan_id, planned_date, slot) groups, retain the authoritative meal, then rerun the migration.';
  END IF;
END $$;

CREATE UNIQUE INDEX "meal_plan_items_plan_date_slot_key" ON "meal_plan_items" ("plan_id", "planned_date", "slot");

CREATE TABLE "recurring_meal_rules" (
    "rule_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "weekday" INTEGER NOT NULL,
    "slot" VARCHAR(16) NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recurring_meal_rules_pkey" PRIMARY KEY ("rule_id"),
    CONSTRAINT "recurring_meal_rules_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6),
    CONSTRAINT "recurring_meal_rules_slot_check" CHECK ("slot" IN ('breakfast', 'lunch', 'dinner', 'snack')),
    CONSTRAINT "recurring_meal_rules_servings_check" CHECK ("servings" BETWEEN 1 AND 24),
    CONSTRAINT "recurring_meal_rules_user_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE,
    CONSTRAINT "recurring_meal_rules_recipe_fk" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE CASCADE
);

CREATE INDEX "recurring_meal_rules_user_weekday_slot_idx" ON "recurring_meal_rules" ("user_id", "weekday", "slot");
