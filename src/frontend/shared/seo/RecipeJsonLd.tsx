import { useEffect, type ReactElement } from 'react';
import {
	createRecipeStructuredData,
	type RecipeStructuredDataRecipe,
} from './recipeStructuredData';

const SITE_URL =
	import.meta.env.VITE_SITE_URL || 'https://foodrecipes1.vercel.app';
const DATA_ATTRIBUTE = 'data-food-recipes-recipe-json-ld';

type RecipeJsonLdProps = {
	recipe: RecipeStructuredDataRecipe | null;
	canonicalPath: string;
};

const getCanonicalUrl = (path: string): string => {
	try {
		return new URL(path, SITE_URL + '/').toString();
	} catch {
		return SITE_URL + path;
	}
};

const RecipeJsonLd = ({
	recipe,
	canonicalPath,
}: RecipeJsonLdProps): ReactElement | null => {
	useEffect(() => {
		document.head
			.querySelectorAll('script[' + DATA_ATTRIBUTE + ']')
			.forEach((element) => element.remove());

		if (!recipe) return undefined;
		const data = createRecipeStructuredData(recipe, getCanonicalUrl(canonicalPath));
		if (!data) return undefined;

		const script = document.createElement('script');
		script.setAttribute('type', 'application/ld+json');
		script.setAttribute(DATA_ATTRIBUTE, 'true');
		script.textContent = JSON.stringify(data);
		document.head.appendChild(script);

		return () => {
			script.remove();
		};
	}, [canonicalPath, recipe]);

	return null;
};

export default RecipeJsonLd;
