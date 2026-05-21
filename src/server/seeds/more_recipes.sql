-- Adds more starter recipes for the Food Recipes website.
-- Run this against the same PostgreSQL database used by the API.
-- The inserts are idempotent by recipe name.

BEGIN;

INSERT INTO public.recipes (
	recipe_name,
	recipe_description,
	meal_id,
	category_id,
	prep_time,
	cook_time,
	user_id,
	ingredients,
	instructions
)
SELECT
	'Lemon Herb Salmon',
	'Bright, flaky salmon baked with lemon, garlic, olive oil, and fresh herbs. Serve it with rice, potatoes, or a crisp salad for an easy dinner.',
	4,
	15,
	INTERVAL '10 minutes',
	INTERVAL '18 minutes',
	0,
	ARRAY['Salmon fillets', 'Lemon juice', 'Olive oil', 'Garlic', 'Parsley', 'Salt', 'Black pepper'],
	ARRAY['Preheat the oven to 400 F', 'Whisk lemon juice, olive oil, garlic, parsley, salt, and pepper', 'Brush the mixture over the salmon', 'Bake until the salmon flakes easily with a fork']
WHERE NOT EXISTS (
	SELECT 1 FROM public.recipes WHERE recipe_name = 'Lemon Herb Salmon'
);

INSERT INTO public.recipes (
	recipe_name,
	recipe_description,
	meal_id,
	category_id,
	prep_time,
	cook_time,
	user_id,
	ingredients,
	instructions
)
SELECT
	'Creamy Tomato Basil Soup',
	'A smooth tomato soup finished with basil and a splash of cream. It is comforting, quick, and perfect with toasted bread or grilled cheese.',
	2,
	2,
	INTERVAL '10 minutes',
	INTERVAL '25 minutes',
	0,
	ARRAY['Canned tomatoes', 'Onion', 'Garlic', 'Vegetable stock', 'Heavy cream', 'Fresh basil', 'Olive oil'],
	ARRAY['Cook onion and garlic in olive oil until soft', 'Add tomatoes and stock, then simmer', 'Blend until smooth', 'Stir in cream and basil before serving']
WHERE NOT EXISTS (
	SELECT 1 FROM public.recipes WHERE recipe_name = 'Creamy Tomato Basil Soup'
);

INSERT INTO public.recipes (
	recipe_name,
	recipe_description,
	meal_id,
	category_id,
	prep_time,
	cook_time,
	user_id,
	ingredients,
	instructions
)
SELECT
	'Mushroom Risotto',
	'Creamy risotto with sauteed mushrooms, parmesan, and a rich broth. It is simple enough for a weeknight but polished enough for guests.',
	4,
	1,
	INTERVAL '15 minutes',
	INTERVAL '35 minutes',
	0,
	ARRAY['Arborio rice', 'Mushrooms', 'Onion', 'Garlic', 'Vegetable stock', 'Parmesan cheese', 'Butter'],
	ARRAY['Saute mushrooms until browned and set aside', 'Cook onion and garlic in butter', 'Toast the rice briefly', 'Add warm stock gradually while stirring', 'Fold in mushrooms and parmesan']
WHERE NOT EXISTS (
	SELECT 1 FROM public.recipes WHERE recipe_name = 'Mushroom Risotto'
);

INSERT INTO public.recipes (
	recipe_name,
	recipe_description,
	meal_id,
	category_id,
	prep_time,
	cook_time,
	user_id,
	ingredients,
	instructions
)
SELECT
	'Avocado Egg Toast',
	'Toasted bread topped with smashed avocado, a soft egg, chili flakes, and lemon. It is fast, filling, and ideal for breakfast.',
	1,
	12,
	INTERVAL '8 minutes',
	INTERVAL '7 minutes',
	0,
	ARRAY['Bread', 'Avocado', 'Eggs', 'Lemon juice', 'Chili flakes', 'Salt', 'Black pepper'],
	ARRAY['Toast the bread until crisp', 'Mash avocado with lemon juice, salt, and pepper', 'Cook eggs to your preference', 'Spread avocado over toast and top with egg and chili flakes']
WHERE NOT EXISTS (
	SELECT 1 FROM public.recipes WHERE recipe_name = 'Avocado Egg Toast'
);

INSERT INTO public.recipes (
	recipe_name,
	recipe_description,
	meal_id,
	category_id,
	prep_time,
	cook_time,
	user_id,
	ingredients,
	instructions
)
SELECT
	'Greek Chicken Salad',
	'A fresh salad with grilled chicken, cucumber, tomatoes, olives, feta, and lemon oregano dressing. It works well for lunch or meal prep.',
	2,
	4,
	INTERVAL '15 minutes',
	INTERVAL '15 minutes',
	0,
	ARRAY['Chicken breast', 'Romaine lettuce', 'Cucumber', 'Tomatoes', 'Olives', 'Feta cheese', 'Lemon juice', 'Olive oil', 'Oregano'],
	ARRAY['Season and grill the chicken until cooked through', 'Chop the vegetables and add them to a bowl', 'Whisk lemon juice, olive oil, and oregano', 'Slice the chicken and toss everything with feta']
WHERE NOT EXISTS (
	SELECT 1 FROM public.recipes WHERE recipe_name = 'Greek Chicken Salad'
);

INSERT INTO public.recipes (
	recipe_name,
	recipe_description,
	meal_id,
	category_id,
	prep_time,
	cook_time,
	user_id,
	ingredients,
	instructions
)
SELECT
	'Beef Tacos',
	'Warm tortillas filled with seasoned beef, lettuce, tomato, cheese, and a squeeze of lime. A quick dinner that is easy to customize.',
	4,
	13,
	INTERVAL '10 minutes',
	INTERVAL '20 minutes',
	0,
	ARRAY['Ground beef', 'Tortillas', 'Taco seasoning', 'Lettuce', 'Tomatoes', 'Cheddar cheese', 'Lime'],
	ARRAY['Brown the beef in a skillet', 'Add taco seasoning and a splash of water', 'Warm the tortillas', 'Fill tortillas with beef, vegetables, cheese, and lime']
WHERE NOT EXISTS (
	SELECT 1 FROM public.recipes WHERE recipe_name = 'Beef Tacos'
);

INSERT INTO public.recipes (
	recipe_name,
	recipe_description,
	meal_id,
	category_id,
	prep_time,
	cook_time,
	user_id,
	ingredients,
	instructions
)
SELECT
	'Garlic Butter Shrimp Rice',
	'Juicy shrimp cooked in garlic butter and served over warm rice. It is fast, savory, and satisfying for busy dinner nights.',
	4,
	15,
	INTERVAL '10 minutes',
	INTERVAL '15 minutes',
	0,
	ARRAY['Shrimp', 'Cooked rice', 'Butter', 'Garlic', 'Lemon juice', 'Parsley', 'Salt', 'Black pepper'],
	ARRAY['Season the shrimp with salt and pepper', 'Melt butter and cook garlic until fragrant', 'Add shrimp and cook until pink', 'Finish with lemon juice and parsley, then serve over rice']
WHERE NOT EXISTS (
	SELECT 1 FROM public.recipes WHERE recipe_name = 'Garlic Butter Shrimp Rice'
);

INSERT INTO public.recipes (
	recipe_name,
	recipe_description,
	meal_id,
	category_id,
	prep_time,
	cook_time,
	user_id,
	ingredients,
	instructions
)
SELECT
	'Blueberry Pancakes',
	'Fluffy pancakes folded with blueberries and cooked until golden. Serve with butter, maple syrup, or yogurt for a bright breakfast.',
	1,
	10,
	INTERVAL '10 minutes',
	INTERVAL '15 minutes',
	0,
	ARRAY['Flour', 'Milk', 'Eggs', 'Blueberries', 'Baking powder', 'Sugar', 'Butter'],
	ARRAY['Whisk the dry ingredients in a bowl', 'Add milk and eggs, then mix gently', 'Fold in blueberries', 'Cook batter on a buttered skillet until golden on both sides']
WHERE NOT EXISTS (
	SELECT 1 FROM public.recipes WHERE recipe_name = 'Blueberry Pancakes'
);

INSERT INTO public.recipes (
	recipe_name,
	recipe_description,
	meal_id,
	category_id,
	prep_time,
	cook_time,
	user_id,
	ingredients,
	instructions
)
SELECT
	'Vegetable Stir Fry Noodles',
	'Colorful vegetables and noodles tossed in a savory soy garlic sauce. It is flexible, fast, and great for using what is in the fridge.',
	4,
	8,
	INTERVAL '15 minutes',
	INTERVAL '15 minutes',
	0,
	ARRAY['Noodles', 'Bell peppers', 'Carrots', 'Broccoli', 'Soy sauce', 'Garlic', 'Sesame oil'],
	ARRAY['Cook noodles according to package instructions', 'Stir fry vegetables until crisp tender', 'Add garlic, soy sauce, and sesame oil', 'Toss noodles with vegetables and sauce']
WHERE NOT EXISTS (
	SELECT 1 FROM public.recipes WHERE recipe_name = 'Vegetable Stir Fry Noodles'
);

INSERT INTO public.recipes (
	recipe_name,
	recipe_description,
	meal_id,
	category_id,
	prep_time,
	cook_time,
	user_id,
	ingredients,
	instructions
)
SELECT
	'Chocolate Banana Bread',
	'Moist banana bread with cocoa and chocolate chips. It is rich enough for dessert but simple enough for an afternoon snack.',
	5,
	9,
	INTERVAL '15 minutes',
	INTERVAL '55 minutes',
	0,
	ARRAY['Ripe bananas', 'Flour', 'Cocoa powder', 'Sugar', 'Eggs', 'Butter', 'Chocolate chips', 'Baking soda'],
	ARRAY['Mash bananas in a bowl', 'Mix in melted butter, sugar, and eggs', 'Fold in flour, cocoa powder, baking soda, and chocolate chips', 'Bake until a toothpick comes out clean']
WHERE NOT EXISTS (
	SELECT 1 FROM public.recipes WHERE recipe_name = 'Chocolate Banana Bread'
);

SELECT pg_catalog.setval(
	'public.recipes_recipe_id_seq',
	GREATEST(
		(SELECT COALESCE(MAX(recipe_id), 1) FROM public.recipes),
		(SELECT last_value FROM public.recipes_recipe_id_seq)
	),
	true
);

COMMIT;
