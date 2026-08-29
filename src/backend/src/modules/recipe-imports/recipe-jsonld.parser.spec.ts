import { parseRecipeJsonLd } from './recipe-jsonld.parser';

const script = (value: unknown) => `<script type="application/ld+json">${JSON.stringify(value)}</script>`;

describe('parseRecipeJsonLd', () => {
  it.each([
    ['single Recipe object', { '@type': 'Recipe', name: 'Soup' }],
    ['@graph Recipe object', { '@graph': [{ '@type': 'BreadcrumbList' }, { '@type': 'Recipe', name: 'Curry' }] }],
    ['array containing Recipe', [{ '@type': 'WebSite' }, { '@type': ['Recipe', 'Thing'], name: 'Pasta' }]],
  ])('supports %s', (_label, jsonLd) => {
    expect(parseRecipeJsonLd(script(jsonLd)).name).toEqual(expect.any(String));
  });

  it('normalizes recipe fields and ISO durations', () => {
    const result = parseRecipeJsonLd(script({
      '@type': 'Recipe', name: 'Pasta', description: 'Comfort food', image: { url: 'https://example.com/pasta.jpg' },
      recipeIngredient: ['200 g pasta', '1 egg'], recipeInstructions: [{ '@type': 'HowToStep', text: 'Boil pasta' }, 'Mix sauce'],
      prepTime: 'PT15M', cookTime: 'PT1H10M', recipeYield: '4 servings',
    }));
    expect(result).toMatchObject({ name: 'Pasta', imageUrl: 'https://example.com/pasta.jpg', prepTimeMinutes: 15, cookTimeMinutes: 70, servings: 4, instructions: ['Boil pasta', 'Mix sauce'] });
  });

  it('rejects pages without a Recipe object', () => {
    expect(() => parseRecipeJsonLd(script({ '@type': 'WebPage', name: 'Not a recipe' }))).toThrow('No supported Recipe JSON-LD');
  });
});
