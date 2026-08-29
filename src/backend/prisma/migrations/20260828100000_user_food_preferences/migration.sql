CREATE TABLE "user_food_preferences" (
    "user_id" INTEGER NOT NULL,
    "diet" VARCHAR(32),
    "cooking_skill" VARCHAR(16),
    "max_weekday_cook_minutes" INTEGER,
    "default_servings" INTEGER NOT NULL DEFAULT 2,
    "max_calories_per_serving" INTEGER,
    "min_protein_grams" DOUBLE PRECISION,
    "strict_dislikes" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_food_preferences_pkey" PRIMARY KEY ("user_id"),
    CONSTRAINT "user_food_preferences_user_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE,
    CONSTRAINT "user_food_preferences_default_servings_check" CHECK ("default_servings" BETWEEN 1 AND 24),
    CONSTRAINT "user_food_preferences_weekday_cook_minutes_check" CHECK (
        "max_weekday_cook_minutes" IS NULL
        OR "max_weekday_cook_minutes" BETWEEN 10 AND 240
    ),
    CONSTRAINT "user_food_preferences_calories_check" CHECK (
        "max_calories_per_serving" IS NULL
        OR "max_calories_per_serving" BETWEEN 100 AND 5000
    ),
    CONSTRAINT "user_food_preferences_protein_check" CHECK (
        "min_protein_grams" IS NULL
        OR "min_protein_grams" BETWEEN 0 AND 300
    )
);

CREATE TABLE "user_avoided_allergens" (
    "avoidance_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "allergen" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_avoided_allergens_pkey" PRIMARY KEY ("avoidance_id"),
    CONSTRAINT "user_avoided_allergens_user_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE,
    CONSTRAINT "user_avoided_allergens_user_allergen_key" UNIQUE ("user_id", "allergen")
);

CREATE INDEX "user_avoided_allergens_user_idx"
ON "user_avoided_allergens" ("user_id");

CREATE TABLE "user_disliked_ingredients" (
    "dislike_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "ingredient_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_disliked_ingredients_pkey" PRIMARY KEY ("dislike_id"),
    CONSTRAINT "user_disliked_ingredients_user_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE,
    CONSTRAINT "user_disliked_ingredients_user_ingredient_key" UNIQUE ("user_id", "ingredient_name")
);

CREATE INDEX "user_disliked_ingredients_user_idx"
ON "user_disliked_ingredients" ("user_id");

CREATE TABLE "user_cuisine_preferences" (
    "preference_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "cuisine" VARCHAR(64) NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_cuisine_preferences_pkey" PRIMARY KEY ("preference_id"),
    CONSTRAINT "user_cuisine_preferences_user_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE,
    CONSTRAINT "user_cuisine_preferences_user_cuisine_key" UNIQUE ("user_id", "cuisine"),
    CONSTRAINT "user_cuisine_preferences_weight_check" CHECK ("weight" BETWEEN -2 AND 2)
);

CREATE INDEX "user_cuisine_preferences_user_idx"
ON "user_cuisine_preferences" ("user_id");
