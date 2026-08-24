CREATE TABLE "recipe_nutrition" (
    "recipe_id" INTEGER NOT NULL,
    "calories_per_serving" INTEGER NOT NULL,
    "protein_grams" DOUBLE PRECISION,
    "carbohydrates_grams" DOUBLE PRECISION,
    "fat_grams" DOUBLE PRECISION,
    "fiber_grams" DOUBLE PRECISION,
    "sugar_grams" DOUBLE PRECISION,
    "sodium_milligrams" INTEGER,
    "source" VARCHAR(32) NOT NULL,
    "source_reference" VARCHAR(255),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_nutrition_pkey" PRIMARY KEY ("recipe_id"),
    CONSTRAINT "recipe_nutrition_source_check" CHECK ("source" IN ('provided_by_author', 'estimated', 'verified_external')),
    CONSTRAINT "recipe_nutrition_values_check" CHECK (
      "calories_per_serving" >= 0 AND
      ("protein_grams" IS NULL OR "protein_grams" >= 0) AND
      ("carbohydrates_grams" IS NULL OR "carbohydrates_grams" >= 0) AND
      ("fat_grams" IS NULL OR "fat_grams" >= 0) AND
      ("fiber_grams" IS NULL OR "fiber_grams" >= 0) AND
      ("sugar_grams" IS NULL OR "sugar_grams" >= 0) AND
      ("sodium_milligrams" IS NULL OR "sodium_milligrams" >= 0)
    ),
    CONSTRAINT "recipe_nutrition_recipe_fk" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE CASCADE
);

CREATE TABLE "recipe_allergens" (
    "allergen_id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "source" VARCHAR(32) NOT NULL,
    "source_reference" VARCHAR(255),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_allergens_pkey" PRIMARY KEY ("allergen_id"),
    CONSTRAINT "recipe_allergens_name_check" CHECK ("name" IN ('milk', 'eggs', 'peanuts', 'tree_nuts', 'soy', 'wheat', 'fish', 'shellfish', 'sesame')),
    CONSTRAINT "recipe_allergens_source_check" CHECK ("source" IN ('provided_by_author', 'estimated', 'verified_external')),
    CONSTRAINT "recipe_allergens_recipe_fk" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "recipe_allergens_recipe_name_key" ON "recipe_allergens"("recipe_id", "name");
CREATE INDEX "recipe_allergens_recipe_idx" ON "recipe_allergens"("recipe_id", "name");
