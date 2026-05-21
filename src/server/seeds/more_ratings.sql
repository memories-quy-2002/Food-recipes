-- Adds more starter ratings and reviews for recipes 1 through 25.
-- Uses only user_id values 1, 2, 3, and 4.
-- The seed is idempotent by (user_id, recipe_id).

BEGIN;

WITH seed_ratings (user_id, recipe_id, score, review, date_added) AS (
	VALUES
		(1, 1, 5.0, 'Classic, filling, and easy to enjoy for lunch.', TIMESTAMP '2026-05-01 10:15:00'),
		(2, 1, 4.0, 'Good burger recipe with simple ingredients.', TIMESTAMP '2026-05-01 12:30:00'),
		(3, 2, 4.0, 'Crispy and satisfying as a snack.', TIMESTAMP '2026-05-02 09:20:00'),
		(4, 2, 3.0, 'Nice side dish, though I would add more seasoning.', TIMESTAMP '2026-05-02 14:10:00'),
		(1, 3, 5.0, 'The chicken is crispy outside and juicy inside.', TIMESTAMP '2026-05-03 18:45:00'),
		(2, 3, 4.0, 'Very tasty and good with rice or salad.', TIMESTAMP '2026-05-03 19:10:00'),
		(3, 6, 4.0, 'Fresh and easy potato salad idea.', TIMESTAMP '2026-05-04 11:05:00'),
		(4, 6, 4.0, 'Good balance of potato and salad flavor.', TIMESTAMP '2026-05-04 12:35:00'),
		(1, 7, 5.0, 'Great bread and filling combination.', TIMESTAMP '2026-05-05 08:30:00'),
		(2, 7, 4.0, 'Simple, tasty, and works well for breakfast.', TIMESTAMP '2026-05-05 09:15:00'),
		(3, 8, 5.0, 'Creamy, savory, and quick to prepare.', TIMESTAMP '2026-05-06 20:25:00'),
		(4, 8, 4.0, 'Good pasta recipe. Extra pepper makes it even better.', TIMESTAMP '2026-05-06 21:05:00'),
		(1, 9, 5.0, 'Rich curry flavor and tender chicken.', TIMESTAMP '2026-05-07 18:15:00'),
		(2, 9, 5.0, 'One of the best dinner recipes on the site.', TIMESTAMP '2026-05-07 19:40:00'),
		(3, 10, 4.0, 'Rich and hearty. The sauce is the best part.', TIMESTAMP '2026-05-08 18:20:00'),
		(4, 10, 5.0, 'Perfect dinner recipe when I want something warm.', TIMESTAMP '2026-05-08 19:40:00'),
		(1, 11, 5.0, 'The sweet and spicy glaze is excellent.', TIMESTAMP '2026-05-09 17:30:00'),
		(2, 11, 4.0, 'Easy to prepare and good for meal prep.', TIMESTAMP '2026-05-09 18:15:00'),
		(3, 12, 4.0, 'Bright flavor and a nice chicken recipe.', TIMESTAMP '2026-05-10 18:55:00'),
		(4, 12, 5.0, 'Beautiful glaze and very tasty.', TIMESTAMP '2026-05-10 19:30:00'),
		(1, 13, 5.0, 'Fresh, quick, and very satisfying.', TIMESTAMP '2026-05-11 12:10:00'),
		(2, 13, 4.0, 'Great simple pasta recipe. I would make it again.', TIMESTAMP '2026-05-11 14:35:00'),
		(3, 15, 5.0, 'Spicy seafood pasta with excellent flavor.', TIMESTAMP '2026-05-12 19:05:00'),
		(4, 15, 4.0, 'Good seafood dish with a creamy sauce.', TIMESTAMP '2026-05-12 20:15:00'),
		(1, 16, 5.0, 'Very quick dessert and it tastes rich.', TIMESTAMP '2026-05-13 21:10:00'),
		(2, 16, 4.0, 'Easy mug cake when I want something sweet.', TIMESTAMP '2026-05-13 21:35:00'),
		(3, 17, 4.0, 'Smooth texture and easy to prepare ahead.', TIMESTAMP '2026-05-14 16:40:00'),
		(4, 17, 5.0, 'Creamy, simple, and great for dessert.', TIMESTAMP '2026-05-14 17:25:00'),
		(1, 23, 3.0, 'Good side dish, but I would add more seasoning.', TIMESTAMP '2026-05-15 12:00:00'),
		(2, 23, 4.0, 'Works well as an appetizer or side.', TIMESTAMP '2026-05-15 12:35:00'),
		(3, 24, 5.0, 'The peanut flavor makes this chicken stand out.', TIMESTAMP '2026-05-16 18:05:00'),
		(4, 24, 4.0, 'Savory, filling, and good for dinner.', TIMESTAMP '2026-05-16 18:45:00'),
		(1, 25, 5.0, 'Fast and flavorful. The shrimp stayed tender.', TIMESTAMP '2026-05-17 19:05:00'),
		(2, 25, 4.0, 'Good seafood recipe with very little effort.', TIMESTAMP '2026-05-17 20:15:00'),
		(3, 1, 4.0, 'A reliable favorite for a casual meal.', TIMESTAMP '2026-05-18 11:20:00'),
		(4, 3, 5.0, 'Crispy chicken with great texture.', TIMESTAMP '2026-05-18 18:50:00'),
		(1, 8, 4.0, 'Simple pasta that still feels special.', TIMESTAMP '2026-05-19 13:10:00'),
		(2, 12, 4.0, 'Good glazed chicken recipe with plenty of flavor.', TIMESTAMP '2026-05-19 18:30:00'),
		(3, 13, 5.0, 'The pesto makes this fresh and bright.', TIMESTAMP '2026-05-20 12:45:00'),
		(4, 25, 5.0, 'Excellent quick shrimp dinner.', TIMESTAMP '2026-05-20 19:30:00')
)
INSERT INTO public.rating (user_id, recipe_id, score, review, date_added)
SELECT
	seed_ratings.user_id,
	seed_ratings.recipe_id,
	seed_ratings.score,
	seed_ratings.review,
	seed_ratings.date_added
FROM seed_ratings
JOIN public.accounts accounts
	ON accounts.user_id = seed_ratings.user_id
JOIN public.recipes recipes
	ON recipes.recipe_id = seed_ratings.recipe_id
WHERE seed_ratings.user_id IN (1, 2, 3, 4)
	AND seed_ratings.recipe_id BETWEEN 1 AND 25
ON CONFLICT (user_id, recipe_id)
DO UPDATE SET
	score = EXCLUDED.score,
	review = EXCLUDED.review,
	date_added = EXCLUDED.date_added;

SELECT pg_catalog.setval(
	'public.rating_rating_id_seq',
	GREATEST(
		(SELECT COALESCE(MAX(rating_id), 1) FROM public.rating),
		(SELECT last_value FROM public.rating_rating_id_seq)
	),
	true
);

COMMIT;
