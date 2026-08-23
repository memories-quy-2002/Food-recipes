import { useQuery, type QueryFunctionContext } from "@tanstack/react-query";
import axios from "@/shared/api/axios";
import type {
	RecipeDetail,
	RecipeListResponse,
	RecipePagination,
	RecipeSummary,
} from "@/shared/api/contracts";
import { getArrayPayload } from "@/shared/api/payload";
import { apiRoutes } from "@/shared/api/routes";

const RECIPE_CATALOG_PAGE_LIMIT = 100;
// Keep the compatibility aggregation bounded even if a valid API response advertises an enormous catalog.
const MAX_RECIPE_CATALOG_PAGES = 1_000;

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const parseRecipePagination = (value: unknown): RecipePagination | undefined => {
	if (!isRecord(value)) return undefined;

	const { page, limit, total, totalPages, hasNext } = value;
	if (
		typeof page !== "number" ||
		!Number.isSafeInteger(page) ||
		page < 1 ||
		typeof limit !== "number" ||
		!Number.isSafeInteger(limit) ||
		limit < 1 ||
		limit > RECIPE_CATALOG_PAGE_LIMIT ||
		typeof total !== "number" ||
		!Number.isSafeInteger(total) ||
		total < 0 ||
		typeof totalPages !== "number" ||
		!Number.isSafeInteger(totalPages) ||
		totalPages < 1 ||
		typeof hasNext !== "boolean"
	) {
		return undefined;
	}

	const expectedTotalPages = Math.max(1, Math.ceil(total / limit));
	if (
		limit !== RECIPE_CATALOG_PAGE_LIMIT ||
		totalPages !== expectedTotalPages ||
		page > totalPages ||
		hasNext !== (page < totalPages)
	) {
		return undefined;
	}

	return { page, limit, total, totalPages, hasNext };
};

const parseRecipeListResponse = (payload: unknown): RecipeListResponse => {
	const recipes = getArrayPayload(payload, "recipes") as RecipeSummary[];
	const pagination = isRecord(payload)
		? parseRecipePagination(payload.pagination)
		: undefined;

	return pagination ? { recipes, pagination } : { recipes };
};

export const fetchAllRecipes = async ({
	signal,
}: Pick<RecipeListQueryContext, "signal">): Promise<RecipeSummary[]> => {
	const endpoint = (apiRoutes as { recipes: string }).recipes;
	const fetchPage = async (page: number) => {
		const response = await axios.get(endpoint, {
			params: { page, limit: RECIPE_CATALOG_PAGE_LIMIT },
			signal,
		});
		return parseRecipeListResponse(response.data);
	};

	let currentPage = 1;
	let currentResponse = await fetchPage(currentPage);
	const recipes = [...currentResponse.recipes];
	let pagesFetched = 1;

	while (
		pagesFetched < MAX_RECIPE_CATALOG_PAGES &&
		currentResponse.pagination?.hasNext &&
		currentResponse.pagination.page === currentPage &&
		currentResponse.pagination.page < currentResponse.pagination.totalPages
	) {
		const nextPage = currentPage + 1;
		if (!Number.isSafeInteger(nextPage) || nextPage <= currentPage) break;

		const nextResponse = await fetchPage(nextPage);
		if (nextResponse.pagination?.page !== nextPage) break;

		recipes.push(...nextResponse.recipes);
		currentPage = nextPage;
		currentResponse = nextResponse;
		pagesFetched += 1;
	}

	return recipes;
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
