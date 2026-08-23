CREATE TABLE "saved_collections" (
    "collection_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saved_collections_pkey" PRIMARY KEY ("collection_id"),
    CONSTRAINT "saved_collections_user_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "saved_collections_user_name_key"
    ON "saved_collections" ("user_id", LOWER("name"));

CREATE TABLE "saved_collection_items" (
    "collection_item_id" SERIAL NOT NULL,
    "collection_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saved_collection_items_pkey" PRIMARY KEY ("collection_item_id"),
    CONSTRAINT "saved_collection_recipe_key" UNIQUE ("collection_id", "recipe_id"),
    CONSTRAINT "saved_collection_items_collection_fk" FOREIGN KEY ("collection_id") REFERENCES "saved_collections"("collection_id") ON DELETE CASCADE,
    CONSTRAINT "saved_collection_items_recipe_fk" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE CASCADE
);

CREATE INDEX "saved_collection_items_recipe_idx" ON "saved_collection_items" ("recipe_id");

CREATE TABLE "review_reports" (
    "report_id" SERIAL NOT NULL,
    "rating_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "reporter_user_id" INTEGER NOT NULL,
    "reason" VARCHAR(32) NOT NULL,
    "details" VARCHAR(1000),
    "status" VARCHAR(16) NOT NULL DEFAULT 'open',
    "resolution_note" VARCHAR(1000),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(6),
    "resolved_by" INTEGER,
    CONSTRAINT "review_reports_pkey" PRIMARY KEY ("report_id"),
    CONSTRAINT "review_reports_reason_check" CHECK ("reason" IN ('spam', 'abuse', 'unsafe', 'copyright', 'other')),
    CONSTRAINT "review_reports_status_check" CHECK ("status" IN ('open', 'resolved', 'dismissed')),
    CONSTRAINT "review_reports_rating_fk" FOREIGN KEY ("rating_id") REFERENCES "rating"("rating_id") ON DELETE CASCADE,
    CONSTRAINT "review_reports_recipe_fk" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE CASCADE,
    CONSTRAINT "review_reports_reporter_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE,
    CONSTRAINT "review_reports_resolver_fk" FOREIGN KEY ("resolved_by") REFERENCES "accounts"("user_id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX "review_reports_open_report_key"
    ON "review_reports" ("rating_id", "reporter_user_id")
    WHERE "status" = 'open';
