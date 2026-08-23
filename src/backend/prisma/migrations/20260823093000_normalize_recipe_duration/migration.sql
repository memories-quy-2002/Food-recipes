-- Task 18: add native minute columns while preserving legacy interval columns.
-- The interval columns remain dual-written for the Express fallback and are
-- intentionally retained for rollback compatibility.

ALTER TABLE "recipes"
    ADD COLUMN "prep_time_minutes" INTEGER,
    ADD COLUMN "cook_time_minutes" INTEGER;

UPDATE "recipes"
SET
    "prep_time_minutes" = ROUND(EXTRACT(EPOCH FROM prep_time) / 60)::integer,
    "cook_time_minutes" = ROUND(EXTRACT(EPOCH FROM cook_time) / 60)::integer;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "recipes"
        WHERE "prep_time_minutes" IS NULL
           OR "prep_time_minutes" <= 0
           OR "cook_time_minutes" IS NULL
           OR "cook_time_minutes" <= 0
    ) THEN
        RAISE EXCEPTION
            'recipe duration backfill produced a NULL or non-positive minute value';
    END IF;
END
$$;

ALTER TABLE "recipes"
    ADD CONSTRAINT "prep_time_minutes_positive_check"
        CHECK ("prep_time_minutes" IS NOT NULL AND "prep_time_minutes" > 0),
    ADD CONSTRAINT "cook_time_minutes_positive_check"
        CHECK ("cook_time_minutes" IS NOT NULL AND "cook_time_minutes" > 0);

ALTER TABLE "recipes"
    ALTER COLUMN "prep_time_minutes" SET NOT NULL,
    ALTER COLUMN "cook_time_minutes" SET NOT NULL;
