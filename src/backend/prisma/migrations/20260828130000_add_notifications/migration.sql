CREATE TABLE "notifications" (
    "notification_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "kind" VARCHAR(64) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "body" VARCHAR(500),
    "action_path" VARCHAR(255),
    "dedupe_key" VARCHAR(255) NOT NULL,
    "read_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

CREATE TABLE "notification_preferences" (
    "user_id" INTEGER NOT NULL,
    "pantry_expiry" BOOLEAN NOT NULL DEFAULT true,
    "meal_reminder" BOOLEAN NOT NULL DEFAULT true,
    "resume_cooking" BOOLEAN NOT NULL DEFAULT true,
    "weekly_plan" BOOLEAN NOT NULL DEFAULT true,
    "household_activity" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id")
);

CREATE UNIQUE INDEX "notifications_user_dedupe_key" ON "notifications"("user_id", "dedupe_key");
CREATE INDEX "notifications_user_read_created_idx" ON "notifications"("user_id", "read_at", "created_at");
