CREATE TABLE "recipe_ingredients" (
    "ingredient_id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "quantity" DECIMAL(12,2),
    "unit" VARCHAR(20),
    "note" VARCHAR(255),
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("ingredient_id"),
    CONSTRAINT "recipe_ingredients_recipe_position_key" UNIQUE ("recipe_id", "position"),
    CONSTRAINT "recipe_ingredients_recipe_fk" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE CASCADE,
    CONSTRAINT "recipe_ingredients_unit_check" CHECK ("unit" IS NULL OR "unit" IN ('GRAM', 'KILOGRAM', 'MILLILITER', 'LITER', 'TEASPOON', 'TABLESPOON', 'CUP', 'PIECE')),
    CONSTRAINT "recipe_ingredients_quantity_check" CHECK ("quantity" IS NULL OR "quantity" >= 0)
);

CREATE INDEX "recipe_ingredients_recipe_idx" ON "recipe_ingredients" ("recipe_id", "position");
