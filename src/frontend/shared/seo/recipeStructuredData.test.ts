import { describe, expect, it } from 'vitest';
import { createRecipeStructuredData } from './recipeStructuredData';

describe('createRecipeStructuredData', () => {
	it('maps public recipe content to Recipe JSON-LD', () => {
		const data = createRecipeStructuredData(
			{
				recipe_name: 'Roasted vegetables',
				recipe_description: 'A simple weeknight tray bake.',
				image_url: '/uploads/roasted.jpg',
				published_at: '2026-09-01T08:00:00.000Z',
				updated_at: '2026-09-02T08:00:00.000Z',
				prep_time_minutes: 10,
				cook_time_minutes: 25,
				category_name: 'Vegetables',
				full_name: 'A Home Cook',
				overall_score: 4.5,
				num_ratings: 12,
				structured_ingredients: [
					{ name: 'olive oil', quantity: 2, unit: 'TABLESPOON', preparation: 'divided' },
				],
				instructions: ['Heat the oven.', 'Roast until tender.'],
				nutrition: { servings: 4, calories: 320, protein: 8 },
				dietary_tags: ['Vegetarian'],
			},
			'https://foodrecipes1.vercel.app/recipe?id=7',
		);

		expect(data).toMatchObject({
			'@context': 'https://schema.org',
			'@type': 'Recipe',
			name: 'Roasted vegetables',
			url: 'https://foodrecipes1.vercel.app/recipe?id=7',
			image: 'https://foodrecipes1.vercel.app/uploads/roasted.jpg',
			prepTime: 'PT10M',
			cookTime: 'PT25M',
			totalTime: 'PT35M',
			recipeYield: '4 servings',
			recipeIngredient: ['2 tbsp olive oil (divided)'],
			recipeInstructions: [
				{ '@type': 'HowToStep', position: 1, text: 'Heat the oven.' },
				{ '@type': 'HowToStep', position: 2, text: 'Roast until tender.' },
			],
			nutrition: {
				'@type': 'NutritionInformation',
				calories: '320 calories',
				proteinContent: '8 g',
			},
			aggregateRating: {
				'@type': 'AggregateRating',
				ratingValue: '4.5',
				ratingCount: 12,
			},
			suitableForDiet: ['https://schema.org/VegetarianDiet'],
			keywords: 'Vegetarian',
		});
	});

	it('omits incomplete or unsafe rich-result fields', () => {
		const data = createRecipeStructuredData(
			{
				recipe_name: 'Safe recipe',
				image_url: 'http://[invalid',
				prep_time_minutes: -1,
				overall_score: 8,
				num_ratings: 0,
				instructions: [null, '  '],
			},
			'https://foodrecipes1.vercel.app/recipe?id=8',
		);

		expect(data).toMatchObject({ '@type': 'Recipe', name: 'Safe recipe' });
		expect(data).not.toHaveProperty('image');
		expect(data).not.toHaveProperty('aggregateRating');
		expect(data).not.toHaveProperty('recipeInstructions');
		expect(data).not.toHaveProperty('prepTime');
	});

	it('returns null when the public recipe has no name', () => {
		expect(createRecipeStructuredData({ recipe_name: '  ' }, 'https://example.com/recipe?id=1')).toBeNull();
	});
});
