ALTER TABLE "accounts"
    ADD COLUMN "role" VARCHAR(16) NOT NULL DEFAULT 'user',
    ADD COLUMN "email_verified_at" TIMESTAMP(6),
    ADD CONSTRAINT "accounts_role_check" CHECK ("role" IN ('user', 'admin'));

CREATE TABLE "auth_sessions" (
    "session_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "family_id" VARCHAR(64) NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(6),
    "replaced_by" INTEGER,
    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("session_id"),
    CONSTRAINT "auth_sessions_token_hash_key" UNIQUE ("token_hash"),
    CONSTRAINT "auth_sessions_user_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE,
    CONSTRAINT "auth_sessions_replaced_by_fk" FOREIGN KEY ("replaced_by") REFERENCES "auth_sessions"("session_id") ON DELETE SET NULL
);

CREATE INDEX "auth_sessions_user_revoked_idx" ON "auth_sessions" ("user_id", "revoked_at");
CREATE INDEX "auth_sessions_family_idx" ON "auth_sessions" ("family_id");

CREATE TABLE "password_reset_tokens" (
    "token_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumed_at" TIMESTAMP(6),
    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("token_id"),
    CONSTRAINT "password_reset_tokens_hash_key" UNIQUE ("token_hash"),
    CONSTRAINT "password_reset_tokens_user_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE
);

CREATE INDEX "password_reset_tokens_user_expiry_idx" ON "password_reset_tokens" ("user_id", "expires_at");

CREATE TABLE "email_verification_tokens" (
    "token_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumed_at" TIMESTAMP(6),
    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("token_id"),
    CONSTRAINT "email_verification_tokens_hash_key" UNIQUE ("token_hash"),
    CONSTRAINT "email_verification_tokens_user_fk" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE
);

CREATE INDEX "email_verification_tokens_user_expiry_idx" ON "email_verification_tokens" ("user_id", "expires_at");
