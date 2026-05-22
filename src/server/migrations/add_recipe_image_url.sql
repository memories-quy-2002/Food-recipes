ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS image_url text;
