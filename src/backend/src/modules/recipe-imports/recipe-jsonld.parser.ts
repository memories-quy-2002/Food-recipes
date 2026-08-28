export type RecipeImportPreview = {
  name: string;
  description?: string;
  imageUrl?: string;
  ingredients: string[];
  instructions: string[];
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
};

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === 'string') return item.trim() ? [item.trim()] : [];
    if (typeof item === 'object' && item !== null && 'text' in item) {
      const text = asString(item.text);
      return text ? [text] : [];
    }
    return [];
  });
};

const parseDuration = (value: unknown): number | undefined => {
  const duration = asString(value);
  if (!duration) return undefined;
  const match = duration.match(/^P(?:([0-9]+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i);
  if (!match) return undefined;
  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);
  const total = days * 1440 + hours * 60 + minutes + Math.ceil(seconds / 60);
  return total > 0 ? total : undefined;
};

const recipeTypes = (value: unknown): string[] => {
  if (typeof value === 'string') return [value.toLowerCase()];
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string').map((item) => item.toLowerCase());
  return [];
};

const findRecipe = (value: unknown): Record<string, unknown> | undefined => {
  if (Array.isArray(value)) {
    return value.map(findRecipe).find((item): item is Record<string, unknown> => Boolean(item));
  }
  if (typeof value !== 'object' || value === null) return undefined;
  const candidate = value as Record<string, unknown>;
  if (recipeTypes(candidate['@type']).includes('recipe')) return candidate;
  if (Array.isArray(candidate['@graph'])) return findRecipe(candidate['@graph']);
  return undefined;
};

const parseImage = (value: unknown): string | undefined => {
  if (typeof value === 'string') return asString(value);
  if (Array.isArray(value)) return parseImage(value[0]);
  if (typeof value === 'object' && value !== null && 'url' in value) return asString(value.url);
  return undefined;
};

const parseInstructions = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    const single = asString(value);
    return single ? [single] : [];
  }
  return value.flatMap((item) => {
    if (typeof item === 'string') return item.trim() ? [item.trim()] : [];
    if (typeof item === 'object' && item !== null) {
      const record = item as Record<string, unknown>;
      const text = asString(record.text) ?? asString(record.name);
      return text ? [text] : [];
    }
    return [];
  });
};

export const parseRecipeJsonLd = (html: string): RecipeImportPreview => {
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) {
    try {
      const parsed = JSON.parse(match[1].trim()) as unknown;
      const recipe = findRecipe(parsed);
      const name = recipe && asString(recipe.name);
      if (!recipe || !name) continue;
      const ingredients = asStringArray(recipe.recipeIngredient);
      const instructions = parseInstructions(recipe.recipeInstructions);
      return {
        name,
        description: asString(recipe.description),
        imageUrl: parseImage(recipe.image),
        ingredients,
        instructions,
        prepTimeMinutes: parseDuration(recipe.prepTime),
        cookTimeMinutes: parseDuration(recipe.cookTime),
        servings: Number.parseInt(asString(recipe.recipeYield) ?? '', 10) || undefined,
      };
    } catch {
      // A page may contain unrelated JSON-LD or malformed markup. Continue to the next block.
    }
  }
  throw new Error('No supported Recipe JSON-LD was found on this page');
};
