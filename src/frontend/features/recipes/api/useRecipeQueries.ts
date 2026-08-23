import { useQuery, type QueryFunctionContext } from "@tanstack/react-query";
import axios from "@/shared/api/axios";
import type {
	RecipeDetail,
	RecipeListResponse,
	RecipePagination,
	RecipeSummary,
} from "@/shared/api/contracts";
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

const hasOwnProperty = (value: Record<string, unknown>, key: string) =>
	Object.prototype.hasOwnProperty.call(value, key);

const parseRecipeListResponse = (
	payload: unknown,
	allowLegacyResponse: boolean
): RecipeListResponse => {
	if (allowLegacyResponse && Array.isArray(payload)) {
		return { recipes: payload as RecipeSummary[] };
	}

	if (!isRecord(payload) || !Array.isArray(payload.recipes)) {
		throw new Error(
			"Recipe catalog response is malformed: expected a recipes array."
		);
	}

	if (!hasOwnProperty(payload, "pagination")) {
		if (allowLegacyResponse) return { recipes: payload.recipes as RecipeSummary[] };

		throw new Error(
			"Recipe catalog response is missing pagination metadata for a requested page."
		);
	}

	const pagination = parseRecipePagination(payload.pagination);
	if (!pagination) {
		throw new Error("Recipe catalog response has malformed pagination metadata.");
	}

	return { recipes: payload.recipes as RecipeSummary[], pagination };
};

const assertPageMetadata = (
	previous: RecipePagination,
	current: RecipePagination,
	requestedPage: number
) => {
	if (current.page !== requestedPage) {
		throw new Error(
			`Recipe catalog pagination did not advance to requested page ${requestedPage}.`
		);
	}

	if (
		current.limit !== previous.limit ||
		current.total !== previous.total ||
		current.totalPages !== previous.totalPages
	) {
		throw new Error(
			`Recipe catalog pagination metadata is inconsistent on page ${requestedPage}.`
		);
	}
};

export const fetchAllRecipes = async ({
	signal,
}: Pick<RecipeListQueryContext, "signal">): Promise<RecipeSummary[]> => {
	const endpoint = (apiRoutes as { recipes: string }).recipes;
	const fetchPage = async (page: number, allowLegacyResponse: boolean) => {
		const response = await axios.get(endpoint, {
			params: { page, limit: RECIPE_CATALOG_PAGE_LIMIT },
			signal,
		});
		return parseRecipeListResponse(response.data, allowLegacyResponse);
	};

	let currentPage = 1;
	const currentResponse = await fetchPage(currentPage, true);
	const recipes = [...currentResponse.recipes];
	let pagesFetched = 1;

	if (!currentResponse.pagination) return recipes;
	if (currentResponse.pagination.page !== currentPage) {
		throw new Error(
			`Recipe catalog pagination did not start at requested page ${currentPage}.`
		);
	}

	let currentPagination = currentResponse.pagination;
	while (currentPagination.hasNext) {
		if (pagesFetched >= MAX_RECIPE_CATALOG_PAGES) {
			throw new Error(
				`Recipe catalog pagination exceeded the maximum of ${MAX_RECIPE_CATALOG_PAGES} pages before completion.`
			);
		}

		const nextPage = currentPage + 1;
		if (!Number.isSafeInteger(nextPage) || nextPage <= currentPage) {
			throw new Error("Recipe catalog pagination could not advance safely.");
		}

		const nextResponse = await fetchPage(nextPage, false);
		if (!nextResponse.pagination) {
			throw new Error(
				`Recipe catalog response is missing pagination metadata on page ${nextPage}.`
			);
		}
		assertPageMetadata(currentPagination, nextResponse.pagination, nextPage);

		recipes.push(...nextResponse.recipes);
		currentPage = nextPage;
		currentPagination = nextResponse.pagination;
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
