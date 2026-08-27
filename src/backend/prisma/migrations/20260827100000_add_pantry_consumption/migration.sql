ALTER TABLE "pantry_items"
  ADD COLUMN "quantity" DECIMAL(12,3),
  ADD COLUMN "unit" VARCHAR(20);

ALTER TABLE "pantry_items"
  ADD CONSTRAINT "pantry_items_quantity_check"
  CHECK ("quantity" IS NULL OR ("quantity" >= 0 AND "quantity" <= 1000000));

ALTER TABLE "pantry_items"
  ADD CONSTRAINT "pantry_items_unit_check"
  CHECK ("unit" IS NULL OR "unit" IN ('GRAM', 'KILOGRAM', 'MILLILITER', 'LITER', 'TEASPOON', 'TABLESPOON', 'CUP', 'PIECE'));

CREATE INDEX "pantry_items_user_quantity_idx"
ON "pantry_items" ("user_id", "have", "quantity");

CREATE TABLE "cooking_ingredient_usage" (
    "usage_id" SERIAL NOT NULL,
    "history_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "pantry_id" INTEGER,
    "ingredient_position" INTEGER NOT NULL,
    "ingredient_name" VARCHAR(255) NOT NULL,
    "required_quantity" DECIMAL(12,3) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "deducted_quantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "missing_quantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cooking_ingredient_usage_pkey" PRIMARY KEY ("usage_id"),
    CONSTRAINT "cooking_ingredient_usage_history_fk" FOREIGN KEY ("history_id") REFERENCES "cooking_history"("history_id") ON DELETE CASCADE,
    CONSTRAINT "cooking_ingredient_usage_user_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE,
    CONSTRAINT "cooking_ingredient_usage_pantry_fk" FOREIGN KEY ("pantry_id") REFERENCES "pantry_items"("pantry_id") ON DELETE SET NULL,
    CONSTRAINT "cooking_ingredient_usage_unit_check" CHECK ("unit" IN ('GRAM', 'KILOGRAM', 'MILLILITER', 'LITER', 'TEASPOON', 'TABLESPOON', 'CUP', 'PIECE')),
    CONSTRAINT "cooking_ingredient_usage_quantity_check" CHECK ("required_quantity" > 0 AND "deducted_quantity" >= 0 AND "missing_quantity" >= 0)
);

CREATE UNIQUE INDEX "cooking_ingredient_usage_history_position_key"
ON "cooking_ingredient_usage" ("history_id", "ingredient_position");

CREATE INDEX "cooking_ingredient_usage_user_created_idx"
ON "cooking_ingredient_usage" ("user_id", "created_at");
