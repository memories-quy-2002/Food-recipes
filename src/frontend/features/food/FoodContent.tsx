import { useMemo, useState, type ChangeEvent, type ReactElement } from "react";
import { BsGrid3X3Gap, BsListUl, BsPlusLg } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import type { RecipePagination, RecipeSummary } from "@/shared/api/contracts";
import type { RecipeDiscoveryState } from "@/features/food/api/useRecipesQuery";
import Button from "@/shared/ui/Button";
import { cn } from "@/shared/lib/utils";
import FoodContentPagination from "./content/FoodContentPagination";
import FoodContentSection from "./content/FoodContentSection";
import FoodContentSectionItem from "./content/FoodContentSectionItem";
import { RECIPE_SORT_OPTIONS } from "./filterOptions";

type RecipeSort = RecipeDiscoveryState["sort"];
type PaginationState = Pick<RecipeDiscoveryState, "page" | "limit">;

export const sortRecipes = (recipes: RecipeSummary[], sortBy: RecipeSort): RecipeSummary[] => {
	const sortedRecipes = [...recipes];
	if (sortBy === "name") return sortedRecipes.sort((a, b) => a.recipe_name.localeCompare(b.recipe_name));
	if (sortBy === "rating") return sortedRecipes.sort((a, b) => Number(b.overall_score || 0) - Number(a.overall_score || 0));
	if (sortBy === "newest") return sortedRecipes.sort((a, b) => new Date(b.date_added || 0).getTime() - new Date(a.date_added || 0).getTime());
	if (sortBy === "quickest") return sortedRecipes.sort((a, b) => Number(a.total_time_minutes || Number.MAX_SAFE_INTEGER) - Number(b.total_time_minutes || Number.MAX_SAFE_INTEGER));
	return sortedRecipes.sort((a, b) => Number(b.num_ratings || 0) - Number(a.num_ratings || 0));
};

export const getVisibleRecipes = (recipes: RecipeSummary[], { page, limit }: PaginationState): RecipeSummary[] =>
	recipes.slice((page - 1) * limit, page * limit);

export const getRecipeContentState = (recipes: RecipeSummary[], { limit }: PaginationState): { isEmpty: boolean; totalPages: number } => ({
	isEmpty: recipes.length === 0,
	totalPages: Math.max(1, Math.ceil(recipes.length / limit)),
});

const LoadingSkeleton = (): ReactElement => (
	<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" aria-busy="true" aria-label="Loading recipes">
		{Array.from({ length: 8 }, (_, index) => <div className="h-80 animate-pulse rounded-xl border border-border bg-muted" key={index} />)}
	</div>
);

type ContentCategory = {
	id: number;
	name: string;
};

export type FoodContentProps = {
	recipes?: RecipeSummary[];
	pagination?: RecipePagination;
	queryState: RecipeDiscoveryState;
	onQueryStateChange?: (changes: Partial<RecipeDiscoveryState>) => void;
	isLoading?: boolean;
	isFetching?: boolean;
	error?: string | null;
	onRetry?: () => void;
};

const isRecipeSort = (value: string): value is RecipeSort =>
	value === "popular" || value === "rating" || value === "newest" || value === "quickest" || value === "name";

const FoodContent = ({
	recipes = [],
	pagination,
	queryState,
	onQueryStateChange = () => undefined,
	isLoading = false,
	isFetching = false,
	error = null,
	onRetry,
}: FoodContentProps): ReactElement => {
	const navigate = useNavigate();
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const isServerPaginated = Boolean(pagination);
	const sortedRecipes = useMemo(
		() => (isServerPaginated ? recipes : sortRecipes(recipes, queryState.sort)),
		[isServerPaginated, recipes, queryState.sort],
	);
	const visibleRecipes = isServerPaginated ? sortedRecipes : getVisibleRecipes(sortedRecipes, queryState);
	const totalRecipes = pagination?.total ?? sortedRecipes.length;
	const totalPages = pagination?.totalPages ?? getRecipeContentState(sortedRecipes, queryState).totalPages;
	const currentPage = pagination?.page ?? queryState.page;
	const categories = useMemo<ContentCategory[]>(() => {
		const categoryMap = new Map<number, ContentCategory>();
		visibleRecipes.forEach((recipe) => {
			if (typeof recipe.category_id !== "number" || typeof recipe.category_name !== "string") return;
			categoryMap.set(recipe.category_id, { id: recipe.category_id, name: recipe.category_name });
		});
		return Array.from(categoryMap.values()).sort((a, b) => a.id - b.id);
	}, [visibleRecipes]);
	const shouldGroupByCategory = Boolean(queryState.categoryId || queryState.mealId);
	const handleSortChange = (event: ChangeEvent<HTMLSelectElement>): void => {
		if (isRecipeSort(event.target.value)) onQueryStateChange({ sort: event.target.value, page: 1 });
	};

	return (
		<div className="min-w-0" aria-busy={isFetching}>
			<div className="mb-5 flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
				<div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Results</p><h2 className="mt-1 text-2xl font-black" aria-live="polite">{isLoading ? "Loading recipes…" : `${totalRecipes} ${totalRecipes === 1 ? "recipe" : "recipes"} found`}</h2></div>
				<div className="flex flex-wrap items-center gap-2">
					<label className="flex min-h-11 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-semibold">Sort<span className="sr-only">recipes by</span><select className="min-h-11 bg-transparent text-sm outline-none" value={queryState.sort} onChange={handleSortChange}>{RECIPE_SORT_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label>
					<div className="flex rounded-lg border border-border p-1" role="group" aria-label="Recipe view mode"><Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="size-11" onClick={() => setViewMode("grid")} aria-pressed={viewMode === "grid"} aria-label="Grid view"><BsGrid3X3Gap /></Button><Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="size-11" onClick={() => setViewMode("list")} aria-pressed={viewMode === "list"} aria-label="List view"><BsListUl /></Button></div>
					<Button className="hidden sm:inline-flex" onClick={() => navigate("/food/add")}><BsPlusLg />Add recipe</Button>
				</div>
			</div>
			{isFetching && !isLoading && <div className="mb-4 rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground" role="status" aria-live="polite">Updating recipes…</div>}
			{isLoading ? <LoadingSkeleton /> : error ? <div className="rounded-xl border border-destructive/25 bg-destructive/10 p-6" role="alert"><h3 className="font-bold text-destructive">Recipe library could not load</h3><p className="mt-2 text-sm text-destructive">{error}</p>{onRetry ? <Button className="mt-4" type="button" onClick={onRetry}>Try again</Button> : null}</div> : sortedRecipes.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center"><h3 className="text-xl font-bold">No recipes found</h3><p className="mt-2 text-muted-foreground">Try another search term or clear one of the filters.</p></div> : shouldGroupByCategory ? categories.map(({ id, name }) => <FoodContentSection key={id} id={id} name={name} recipes={visibleRecipes} viewMode={viewMode} />) : <div className={cn("grid gap-4", viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1")}>{visibleRecipes.map((recipe) => <FoodContentSectionItem key={recipe.recipe_id} recipe={recipe} viewMode={viewMode} />)}</div>}
			{!isLoading && !error && totalPages > 1 && <FoodContentPagination recipesPerPage={queryState.limit} totalRecipes={totalRecipes} totalPages={totalPages} onPagination={(page) => onQueryStateChange({ page })} currentPage={currentPage} />}
			<Button className="mt-5 w-full sm:hidden" onClick={() => navigate("/food/add")}><BsPlusLg />Add recipe</Button>
		</div>
	);
};

export default FoodContent;
