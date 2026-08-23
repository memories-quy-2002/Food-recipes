-- Food Recipes baseline migration for the legacy PostgreSQL schema.
--
-- This is a create-schema baseline generated from the checked-in Prisma
-- datamodel. It describes schema objects only and contains no application
-- rows or sequence state. An existing database that already has this
-- matching schema must record 0_init as applied after backup and inspection;
-- it must not execute this create-schema script against its data-bearing
-- tables.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "accounts" (
    "user_id" SERIAL NOT NULL,
    "full_name" VARCHAR(124) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "created_on" TIMESTAMP(6) NOT NULL,
    "last_login" TIMESTAMP(6),
    "phone" VARCHAR(20),
    "address" VARCHAR(255),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "categories" (
    "category_id" SERIAL NOT NULL,
    "category_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "meals" (
    "meal_id" SERIAL NOT NULL,
    "meal_name" VARCHAR(50) NOT NULL,
    "meal_description" TEXT,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("meal_id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "recipe_id" SERIAL NOT NULL,
    "recipe_name" VARCHAR(255) NOT NULL,
    "recipe_description" TEXT,
    "meal_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "prep_time" interval NOT NULL,
    "cook_time" interval NOT NULL,
    "date_added" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "ingredients" TEXT[],
    "instructions" TEXT[],

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("recipe_id"),
    CONSTRAINT "cook_time_check" CHECK (("cook_time" > '00:00:00'::interval)),
    CONSTRAINT "prep_time_check" CHECK (("prep_time" > '00:00:00'::interval))
);

-- CreateTable
CREATE TABLE "wishlist" (
    "wishlist_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "date_added" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_pkey" PRIMARY KEY ("wishlist_id")
);

-- CreateTable
CREATE TABLE "rating" (
    "rating_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "score" DECIMAL(10,2),
    "review" TEXT,
    "date_added" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rating_pkey" PRIMARY KEY ("rating_id"),
    CONSTRAINT "rating_score_check" CHECK ((((score)::double precision >= (0.0)::double precision) AND ((score)::double precision <= (5.0)::double precision)))
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_recipe_constraint" ON "wishlist"("user_id", "recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_recipe_pair" ON "rating"("user_id", "recipe_id");

-- AddForeignKey
ALTER TABLE "recipes"
    ADD CONSTRAINT "rafk_user_id" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recipes"
    ADD CONSTRAINT "rcfk_category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recipes"
    ADD CONSTRAINT "rmfk_meal_id" FOREIGN KEY ("meal_id") REFERENCES "meals"("meal_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rating"
    ADD CONSTRAINT "rtafk_user_id" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "rating"
    ADD CONSTRAINT "rtrfk_user_id" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON UPDATE CASCADE ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist"
    ADD CONSTRAINT "wafk_user_id" FOREIGN KEY ("user_id") REFERENCES "accounts"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wishlist"
    ADD CONSTRAINT "wrfk_recipe_id" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE CASCADE ON UPDATE NO ACTION;
