// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import RecipeJsonLd from './RecipeJsonLd';

afterEach(cleanup);

describe('RecipeJsonLd', () => {
	it('publishes safe JSON-LD only for published recipes', () => {
		const { rerender } = render(
			<RecipeJsonLd
				canonicalPath='/recipe?id=7'
				recipe={{ status: 'published', recipe_name: 'Soup </script><script>alert(1)</script>' }}
			/>,
		);

		const script = document.head.querySelector('script[type="application/ld+json"]');
		expect(script?.textContent).toContain('\\u003c/script>');
		expect(JSON.parse(script?.textContent ?? '{}')).toMatchObject({
			'@type': 'Recipe',
			name: 'Soup </script><script>alert(1)</script>',
		});

		rerender(
			<RecipeJsonLd
				canonicalPath='/recipe?id=7'
				recipe={{ status: 'draft', recipe_name: 'Private soup' }}
			/>,
		);
		expect(document.head.querySelector('script[type="application/ld+json"]')).toBeNull();
	});
});
