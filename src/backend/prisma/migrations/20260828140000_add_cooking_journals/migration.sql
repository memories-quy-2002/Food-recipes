CREATE TABLE "cooking_journals" (
    "journal_id" SERIAL NOT NULL,
    "history_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rating" SMALLINT,
    "would_cook_again" BOOLEAN,
    "notes" VARCHAR(4000),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cooking_journals_pkey" PRIMARY KEY ("journal_id"),
    CONSTRAINT "cooking_journals_history_key" UNIQUE ("history_id"),
    CONSTRAINT "cooking_journals_rating_check" CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 5)
);

CREATE TABLE "cooking_journal_photos" (
    "photo_id" SERIAL NOT NULL,
    "journal_id" INTEGER NOT NULL,
    "object_path" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cooking_journal_photos_pkey" PRIMARY KEY ("photo_id")
);

CREATE INDEX "cooking_journals_user_updated_idx" ON "cooking_journals"("user_id", "updated_at");
CREATE INDEX "cooking_journal_photos_journal_created_idx" ON "cooking_journal_photos"("journal_id", "created_at");
