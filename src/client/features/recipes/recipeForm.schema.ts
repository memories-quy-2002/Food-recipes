import { z } from "zod";

const DURATION_UNITS = ["seconds", "minutes", "hours", "days"] as const;
type RecipeCatalogItem = Record<string, unknown>;
type RecipeFormSchemaOptions = {
	categories?: RecipeCatalogItem[];
	meals?: RecipeCatalogItem[];
	isPublishing?: boolean;
};

const normalizeCatalogName = (value: unknown) => String(value ?? "").trim().toLowerCase();

const catalogNameSchema = (items: unknown[], message: string) =>
	z.string().trim().refine(
		(value) => {
			const normalizedValue = normalizeCatalogName(value);
			return Boolean(
				normalizedValue &&
				items.some((item) => {
					if (!item || typeof item !== "object") return false;
					const catalogItem = item as Record<string, unknown>;
					return (
						normalizeCatalogName(
							catalogItem.name ?? catalogItem.category_name ?? catalogItem.meal_name
						) === normalizedValue
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

const baseRecipeFormSchema = ({ categories = [], meals = [] }: RecipeFormSchemaOptions = {}) =>
	z.object({
		recipeName: z.string().trim().min(1, "Recipe name is required."),
		recipeCategoryName: catalogNameSchema(categories, "Choose a supported category."),
		recipeMealName: catalogNameSchema(meals, "Choose a supported meal."),
		recipeDescription: z.string(),
		recipeIngredients: meaningfulListSchema("Add at least one ingredient."),
		recipeInstructions: meaningfulListSchema("Add at least one instruction."),
		recipePrepTime: durationSchema("Preparation time must be a positive number."),
		recipeCookTime: durationSchema("Cooking time must be a positive number."),
		recipeImage: z.any().nullable().optional(),
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
				} else if (!String(value.recipeImage.type || "").startsWith("image/")) {
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
