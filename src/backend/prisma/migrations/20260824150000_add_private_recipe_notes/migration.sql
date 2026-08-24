CREATE TABLE "recipe_notes" (
    "note_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "note" VARCHAR(2000) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recipe_notes_pkey" PRIMARY KEY ("note_id"),
    CONSTRAINT "recipe_notes_user_recipe_key" UNIQUE ("user_id", "recipe_id"),
    CONSTRAINT "recipe_notes_user_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE,
    CONSTRAINT "recipe_notes_recipe_fk" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE CASCADE
);

CREATE INDEX "recipe_notes_recipe_idx" ON "recipe_notes" ("recipe_id");
