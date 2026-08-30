CREATE TABLE "recommendation_not_interested" (
    "not_interested_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recommendation_not_interested_pkey" PRIMARY KEY ("not_interested_id"),
    CONSTRAINT "recommendation_not_interested_user_recipe_key" UNIQUE ("user_id", "recipe_id"),
    CONSTRAINT "recommendation_not_interested_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE,
    CONSTRAINT "recommendation_not_interested_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE CASCADE
);

CREATE INDEX "recommendation_not_interested_user_idx" ON "recommendation_not_interested"("user_id");
