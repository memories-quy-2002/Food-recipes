ALTER TABLE "pantry_items"
  ADD COLUMN "purchased_at" DATE,
  ADD COLUMN "opened_at" DATE,
  ADD COLUMN "expires_at" DATE,
  ADD COLUMN "storage_location" VARCHAR(32);

ALTER TABLE "pantry_items"
  ADD CONSTRAINT "pantry_items_storage_location_check"
  CHECK ("storage_location" IS NULL OR "storage_location" IN ('pantry', 'fridge', 'freezer', 'other'));

CREATE INDEX "pantry_items_user_expires_idx"
ON "pantry_items" ("user_id", "expires_at");
