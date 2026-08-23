import { useQuery, type QueryFunctionContext } from "@tanstack/react-query";
import axios from "@/shared/api/axios";
import type { RecipeDetail, RecipeSummary } from "@/shared/api/contracts";
import { getArrayPayload } from "@/shared/api/payload";
import { apiRoutes } from "@/shared/api/routes";

export const recipeQueryKeys = {
	all: ["recipes"] as const,
	list: () => ["recipes", "list"] as const,
	detail: (recipeId: string | number) =>
		["recipes", "detail", String(recipeId)] as const,
};

type RecipeListQueryContext = QueryFunctionContext<
	ReturnType<typeof recipeQueryKeys.list>
>;
type RecipeDetailQueryContext = QueryFunctionContext<
	ReturnType<typeof recipeQueryKeys.detail>
>;

export const fetchAllRecipes = async ({
	 signal,
}: Pick<RecipeListQueryContext, "signal">): Promise<RecipeSummary[]> => {
	const response = await axios.get(
		(apiRoutes as { recipes: string }).recipes,
		{ signal }
	);
	const payload = response.data as unknown as { recipes?: RecipeSummary[] };
	return getArrayPayload(payload, "recipes") as RecipeSummary[];
};

type RecipeDetailQueryInput = Pick<
	RecipeDetailQueryContext,
	"queryKey" | "signal"
>;

export const fetchRecipe = async ({
	queryKey,
	signal,
}: RecipeDetailQueryInput): Promise<RecipeDetail> => {
	const [, , recipeId] = queryKey;
	const response = await axios.get(
		(apiRoutes as { recipe: (id: string) => string }).recipe(recipeId),
		{ signal }
	);
	const payload = response.data as unknown as { recipe: RecipeDetail };
	return payload.recipe;
};

export const useAllRecipesQuery = () =>
	useQuery({
		queryKey: recipeQueryKeys.list(),
		queryFn: fetchAllRecipes,
	});

export const useRecipeQuery = (recipeId: string | number | null | undefined) =>
	useQuery({
		queryKey: recipeQueryKeys.detail(recipeId ?? ""),
		queryFn: fetchRecipe,
		enabled: Boolean(recipeId),
	});
