CREATE TABLE "households" (
    "household_id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "households_pkey" PRIMARY KEY ("household_id")
);

CREATE TABLE "household_members" (
    "member_id" SERIAL NOT NULL,
    "household_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" VARCHAR(16) NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "household_members_pkey" PRIMARY KEY ("member_id"),
    CONSTRAINT "household_members_role_check" CHECK ("role" IN ('OWNER', 'MEMBER', 'VIEWER')),
    CONSTRAINT "household_members_household_user_key" UNIQUE ("household_id", "user_id")
);

CREATE TABLE "household_invites" (
    "invite_id" SERIAL NOT NULL,
    "household_id" INTEGER NOT NULL,
    "invited_by" INTEGER NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "accepted_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "household_invites_pkey" PRIMARY KEY ("invite_id"),
    CONSTRAINT "household_invites_token_hash_key" UNIQUE ("token_hash")
);

ALTER TABLE "pantry_items" ADD COLUMN "household_id" INTEGER;
ALTER TABLE "meal_plans" ADD COLUMN "household_id" INTEGER;
ALTER TABLE "shopping_list_items" ADD COLUMN "household_id" INTEGER;

ALTER TABLE "pantry_items" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "meal_plans" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "shopping_list_items" ALTER COLUMN "user_id" DROP NOT NULL;

ALTER TABLE "pantry_items" ADD CONSTRAINT "pantry_items_owner_check" CHECK (("user_id" IS NOT NULL AND "household_id" IS NULL) OR ("user_id" IS NULL AND "household_id" IS NOT NULL));
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_owner_check" CHECK (("user_id" IS NOT NULL AND "household_id" IS NULL) OR ("user_id" IS NULL AND "household_id" IS NOT NULL));
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_owner_check" CHECK (("user_id" IS NOT NULL AND "household_id" IS NULL) OR ("user_id" IS NULL AND "household_id" IS NOT NULL));

CREATE INDEX "household_members_user_idx" ON "household_members"("user_id");
CREATE INDEX "household_invites_household_email_idx" ON "household_invites"("household_id", "email");
