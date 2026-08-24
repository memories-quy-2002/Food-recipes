CREATE TABLE "pantry_items" (
    "pantry_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "have" BOOLEAN NOT NULL DEFAULT TRUE,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pantry_items_pkey" PRIMARY KEY ("pantry_id"),
    CONSTRAINT "pantry_items_user_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "pantry_items_user_name_key" ON "pantry_items" ("user_id", LOWER("name"));
CREATE INDEX "pantry_items_user_have_idx" ON "pantry_items" ("user_id", "have");
