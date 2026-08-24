import { z } from "zod";

const DURATION_UNITS = ["seconds", "minutes", "hours", "days"] as const;
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

const meaningfulListSchema = (message: string) =>
	z.array(z.string()).refine(
		(values) => values.some((value) => value.trim().length > 0),
		{ message }
	);

const durationSchema = (message: string) =>
	z.object({
		number: z.union([z.string(), z.number()]).refine(
			(value) => Number.isFinite(Number(value)) && Number(value) > 0,
			{ message }
		),
		unit: z.enum(DURATION_UNITS),
	});

const optionalNumberSchema = z.union([z.string(), z.number()]).refine(
	(value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0),
	{ message: "Nutrition values must be zero or greater." },
);

const optionalIntegerSchema = z.union([z.string(), z.number()]).refine(
	(value) => value === "" || (Number.isInteger(Number(value)) && Number(value) >= 0),
	{ message: "This nutrition value must be a whole number." },
);

const recipeNutritionSchema = z.object({
	caloriesPerServing: optionalIntegerSchema,
	proteinGrams: optionalNumberSchema,
	carbohydratesGrams: optionalNumberSchema,
	fatGrams: optionalNumberSchema,
	fiberGrams: optionalNumberSchema,
	sugarGrams: optionalNumberSchema,
	sodiumMilligrams: optionalIntegerSchema,
	source: z.enum(["provided_by_author", "estimated", "verified_external"]),
	sourceReference: z.string(),
});

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
		recipeIngredients: meaningfulListSchema("Add at least one ingredient."),
		recipeInstructions: meaningfulListSchema("Add at least one instruction."),
		recipePrepTime: durationSchema("Preparation time must be a positive number."),
		recipeCookTime: durationSchema("Cooking time must be a positive number."),
		recipeImage: z.any().nullable().optional(),
		recipeNutrition: recipeNutritionSchema.optional(),
		recipeAllergens: z.array(z.string()).optional(),
	});

export const createRecipeFormSchema = ({ categories = [], meals = [], isPublishing = false }: RecipeFormSchemaOptions = {}) => {
	const schema = baseRecipeFormSchema({ categories, meals });

	return isPublishing
		? schema.superRefine((value, context) => {
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
