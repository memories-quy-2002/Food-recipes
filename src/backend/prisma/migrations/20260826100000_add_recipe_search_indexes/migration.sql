CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS recipes_name_trgm_idx
ON recipes USING GIN (recipe_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS recipes_description_trgm_idx
ON recipes USING GIN (recipe_description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS recipes_search_document_idx
ON recipes USING GIN (
  to_tsvector(
    'simple',
    COALESCE(recipe_name, '') || ' ' || COALESCE(recipe_description, '')
  )
);
