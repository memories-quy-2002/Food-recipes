import { z } from "zod";

const DURATION_UNITS = ["seconds", "minutes", "hours", "days"] as const;
const RECIPE_INGREDIENT_UNITS = new Set([
	"g", "gram", "grams", "kg", "kilogram", "kilograms",
	"ml", "milliliter", "milliliters", "l", "liter", "liters", "litre", "litres",
	"tsp", "teaspoon", "teaspoons", "tbsp", "tablespoon", "tablespoons",
	"cup", "cups", "pc", "pcs", "piece", "pieces",
]);
type RecipeCatalogItem = Record<string, unknown>;
type RecipeFormSchemaOptions = {
	categories?: RecipeCatalogItem[];
	meals?: RecipeCatalogItem[];
	isPublishing?: boolean;
};

const normalizeCatalogName = (value: unknown) => String(value ?? "").trim().toLowerCase();

const catalogNameSchema = (items: unknown[], fields: string[], message: string) =>
	z.string().trim().refine(
		(value) => {
			const normalizedValue = normalizeCatalogName(value);
			return Boolean(
				normalizedValue &&
				items.some((item) => {
					if (!item || typeof item !== "object") return false;
					const catalogItem = item as Record<string, unknown>;
					return fields.some(
						(field) => normalizeCatalogName(catalogItem[field]) === normalizedValue
					);
				})
			);
		},
		{ message }
	);

const meaningfulListSchema = (message: string) => z.array(z.string()).refine(
	(values) => values.some((value) => value.trim().length > 0),
	{ message }
);

const hasPositiveIngredientQuantity = (ingredient: { quantity?: number | null; quantityText?: string }) => {
	if (typeof ingredient.quantity === "number") return Number.isFinite(ingredient.quantity) && ingredient.quantity > 0;
	const value = String(ingredient.quantityText || "").trim().replace(",", ".");
	const parsed = value.match(/^(\d+(?:\.\d+)?)\s+(\d+)\/(\d+)$/) || value.match(/^(\d+)\/(\d+)$/);
	if (parsed) {
		const denominator = Number(parsed[parsed.length - 1]);
		return denominator > 0;
	}
	return Number.isFinite(Number(value)) && Number(value) > 0;
};

const hasSupportedIngredientUnit = (unit: string): boolean => RECIPE_INGREDIENT_UNITS.has(unit.trim().toLowerCase());

const durationSchema = (message: string) =>
	z.object({
		number: z.union([z.string(), z.number()]).refine(
			(value) => Number.isFinite(Number(value)) && Number(value) > 0,
			{ message }
		),
		unit: z.enum(DURATION_UNITS),
	});

const structuredIngredientSchema = z.object({
	position: z.number().int().nonnegative().optional(),
	quantity: z.union([z.number(), z.null()]).optional(),
	quantityText: z.string().optional().default(""),
	unit: z.string().optional().default(""),
	name: z.string(),
	preparation: z.string().optional().default(""),
	originalText: z.string().nullable().optional(),
});

const manualNutritionValueSchema = z.union([z.string(), z.number(), z.null()])
	.refine(
		(value) => value === null || value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0),
		{ message: "Nutrition values must be zero or greater." }
	);

const nutritionSchema = z.object({
	servings: manualNutritionValueSchema.optional(),
	calories: manualNutritionValueSchema.optional(),
	protein: manualNutritionValueSchema.optional(),
	carbohydrates: manualNutritionValueSchema.optional(),
	fat: manualNutritionValueSchema.optional(),
	fiber: manualNutritionValueSchema.optional(),
	sugar: manualNutritionValueSchema.optional(),
	sodium: manualNutritionValueSchema.optional(),
}).default({});

const tagsSchema = z.array(z.string().trim().min(1, "Tags cannot be empty.")).max(30).default([]);

const recipeNutritionSchema = z.object({
	caloriesPerServing: z.union([z.string(), z.number()]).refine((value) => value === "" || (Number.isInteger(Number(value)) && Number(value) >= 0), { message: "This nutrition value must be a whole number." }),
	proteinGrams: z.union([z.string(), z.number()]).refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0), { message: "Nutrition values must be zero or greater." }),
	carbohydratesGrams: z.union([z.string(), z.number()]).refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0), { message: "Nutrition values must be zero or greater." }),
	fatGrams: z.union([z.string(), z.number()]).refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0), { message: "Nutrition values must be zero or greater." }),
	fiberGrams: z.union([z.string(), z.number()]).refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0), { message: "Nutrition values must be zero or greater." }),
	sugarGrams: z.union([z.string(), z.number()]).refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0), { message: "Nutrition values must be zero or greater." }),
	sodiumMilligrams: z.union([z.string(), z.number()]).refine((value) => value === "" || (Number.isInteger(Number(value)) && Number(value) >= 0), { message: "This nutrition value must be a whole number." }),
	source: z.enum(["provided_by_author", "estimated", "verified_external"]),
	sourceReference: z.string(),
}).optional();

const baseRecipeFormSchema = ({ categories = [], meals = [] }: RecipeFormSchemaOptions = {}) =>
	z.object({
		recipeName: z.string().trim().min(1, "Recipe name is required."),
		recipeCategoryName: catalogNameSchema(
			categories,
			["name", "category_name"],
			"Choose a supported category."
		),
		recipeMealName: catalogNameSchema(
			meals,
			["name", "meal_name"],
			"Choose a supported meal."
		),
		recipeDescription: z.string(),
		recipeIngredients: z.array(z.string()),
		recipeInstructions: meaningfulListSchema("Add at least one instruction."),
		recipePrepTime: durationSchema("Preparation time must be a positive number."),
		recipeCookTime: durationSchema("Cooking time must be a positive number."),
		recipeImage: z.any().nullable().optional(),
		structuredIngredients: z.array(structuredIngredientSchema).max(100).default([]),
		nutrition: nutritionSchema,
		dietaryTags: tagsSchema,
		allergenTags: tagsSchema,
		serverRecipeId: z.union([z.number().int().positive(), z.string()]).nullable().optional(),
		recipeNutrition: recipeNutritionSchema,
		recipeAllergens: z.array(z.string()).optional(),
	}).superRefine((value, context) => {
		const hasLegacyIngredient = value.recipeIngredients.some((ingredient) => ingredient.trim().length > 0);
		const hasStructuredIngredient = value.structuredIngredients.some((ingredient) => ingredient.name.trim().length > 0);
		if (!hasLegacyIngredient && !hasStructuredIngredient) {
			context.addIssue({ code: z.ZodIssueCode.custom, path: ["recipeIngredients"], message: "Add at least one ingredient." });
		}

		value.structuredIngredients.forEach((ingredient, index) => {
			const hasOtherContent = [ingredient.quantityText, ingredient.unit, ingredient.preparation].some((field) => field.trim().length > 0);
			if (hasOtherContent && !ingredient.name.trim()) {
				context.addIssue({ code: z.ZodIssueCode.custom, path: ["structuredIngredients", index, "name"], message: "Ingredient name is required." });
			}
		});
	});

export const createRecipeFormSchema = ({ categories = [], meals = [], isPublishing = false }: RecipeFormSchemaOptions = {}) => {
	const schema = baseRecipeFormSchema({ categories, meals });

	return isPublishing
		? schema.superRefine((value, context) => {
			const unquantifiedIngredients = value.structuredIngredients.filter((ingredient) => Boolean(ingredient.name.trim()) && (!hasPositiveIngredientQuantity(ingredient) || !hasSupportedIngredientUnit(ingredient.unit)));
			if (!value.structuredIngredients.some((ingredient) => ingredient.name.trim()) || unquantifiedIngredients.length > 0) {
				context.addIssue({ code: z.ZodIssueCode.custom, path: ["structuredIngredients"], message: "Every ingredient needs a positive quantity and unit before publishing." });
			}
				if (!value.recipeImage) {
					context.addIssue({
						code: z.ZodIssueCode.custom,
						path: ["recipeImage"],
						message: "Choose a recipe image before publishing.",
					});
				} else {
					const mimeType = String(value.recipeImage.type || "").trim().toLowerCase();
					if (mimeType.startsWith("image/") && mimeType.length > "image/".length) return;
					context.addIssue({
						code: z.ZodIssueCode.custom,
						path: ["recipeImage"],
						message: "Choose a valid recipe image before publishing.",
					});
				}
			})
		: schema;
};

export const recipeFormSchema = createRecipeFormSchema();
export type RecipeFormValues = z.infer<typeof recipeFormSchema>;
