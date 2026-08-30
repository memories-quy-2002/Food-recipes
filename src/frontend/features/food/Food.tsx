import { Suspense, lazy, useEffect, useState, type ChangeEvent, type ReactElement } from "react";
import { isAxiosError } from "axios";
import { SlidersHorizontal } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import type { CatalogItem } from "@/shared/api/contracts";
import axios from "@/shared/api/axios";
import { getArrayPayload } from "@/shared/api/payload";
import { apiRoutes } from "@/shared/api/routes";
import FoodMenuBar from "@/features/food/FoodMenuBar";
import FilterSheet from "@/features/food/FilterSheet";
import ActiveFilterChips from "@/features/food/ActiveFilterChips";
import PageHelmet from "@/shared/seo/PageHelmet";
import PageState from "@/shared/ui/PageState";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import { Card } from "@/shared/ui/Card";
import { parseRecipeDiscoveryState, useRecipesQuery, type RecipeDiscoveryState } from "@/features/food/api/useRecipesQuery";
import { RECIPE_FILTER_OPTIONS } from "./filterOptions";

const FoodContent = lazy(() => import("@/features/food/FoodContent"));

const isCatalogItem = (value: unknown): value is CatalogItem =>
	typeof value === "object" && value !== null &&
		"id" in value && typeof value.id === "number" &&
		"name" in value && typeof value.name === "string";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

export const getApiErrorMessage = (error: unknown, fallback: string): string | null => {
	if (error == null) return null;
	if (!isAxiosError(error)) return error instanceof Error && error.message ? error.message : fallback;
	const data = error.response?.data;
	return isRecord(data) && typeof data.message === "string" ? data.message : error.message || fallback;
};

const Food = (): ReactElement => {
	const [categories, setCategories] = useState<CatalogItem[]>([]);
	const [meals, setMeals] = useState<CatalogItem[]>([]);
	const [filtersError, setFiltersError] = useState<string | null>(null);
	const [isLoadingFilters, setIsLoadingFilters] = useState<boolean>(true);
	const navigate = useNavigate();
	const location = useLocation();
	const queryState = parseRecipeDiscoveryState(location.search);
	const recipesQuery = useRecipesQuery(queryState);
	const [isFilterSheetOpen, setIsFilterSheetOpen] = useState<boolean>(false);
	const activeFilterCount = [queryState.q, queryState.categoryId, queryState.mealId, queryState.filter].filter(Boolean).length;

	const updateQueryState = (changes: Partial<RecipeDiscoveryState>): void => {
		const nextState = { ...queryState, ...changes };
		const params = new URLSearchParams();
		if (nextState.q) params.set("q", nextState.q);
		if (nextState.categoryId) params.set("categoryId", nextState.categoryId);
		if (nextState.mealId) params.set("mealId", nextState.mealId);
		if (nextState.filter) params.set("filter", nextState.filter);
		if (nextState.sort !== "popular") params.set("sort", nextState.sort);
		if (nextState.page !== 1) params.set("page", String(nextState.page));
		if (nextState.limit !== 12) params.set("limit", String(nextState.limit));
		navigate(`/food${params.toString() ? `?${params.toString()}` : ""}`);
	};

	useEffect(() => {
		const fetchFilters = async (): Promise<void> => {
			try {
				setIsLoadingFilters(true);
				setFiltersError(null);
				const [categoryResponse, mealResponse] = await Promise.all([
					axios.get<unknown>(apiRoutes.categories),
					axios.get<unknown>(apiRoutes.meals),
				]);
				setCategories(getArrayPayload(categoryResponse.data, "categories", isCatalogItem));
				setMeals(getArrayPayload(mealResponse.data, "meals", isCatalogItem));
			} catch (error: unknown) {
				console.error(error);
				setFiltersError(getApiErrorMessage(error, "Unable to load recipe filters."));
			} finally {
				setIsLoadingFilters(false);
			}
		};
		void fetchFilters();
	}, []);

	const filtersReady = !isLoadingFilters && !filtersError;
	const summaryItems: Array<{ value: number; label: string }> = [
		{ value: recipesQuery.data?.pagination?.total ?? recipesQuery.data?.recipes.length ?? 0, label: "Recipes" },
		{ value: categories.length, label: "Categories" },
		{ value: meals.length, label: "Meals" },
	];

	return (
		<main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
			<PageHelmet title="Recipes" description="Search, filter, and compare recipes by category, meal type, name, and rating." path="/food" />
			<div className="mx-auto w-full max-w-[96rem]">
				<section className="mb-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
					<div className="max-w-3xl">
						<h1 className="text-3xl font-black tracking-[-0.035em] text-foreground sm:text-4xl lg:text-5xl">Find something worth cooking</h1>
						<p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Search by name, narrow by category or meal, then compare recipes without losing your place.</p>
					</div>
					<div className="grid grid-cols-3 gap-2 sm:gap-3" role="group" aria-label="Recipe library summary">
						{summaryItems.map(({ value, label }) => <Card key={label} className="min-w-0 p-3 text-center sm:min-w-28 sm:p-4"><strong className="block text-xl font-black text-foreground sm:text-2xl">{value}</strong><span className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</span></Card>)}
					</div>
				</section>

				{!filtersReady ? <PageState type={filtersError ? "error" : undefined} title={filtersError ? "Recipe filters could not load" : "Loading recipe filters"} message={filtersError || "Fetching categories and meal filters."} /> : (
					<div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[304px_minmax(0,1fr)]">
						<div className="hidden lg:block"><FoodMenuBar categoryId={queryState.categoryId} mealId={queryState.mealId} searchTerm={queryState.q} categories={categories} meals={meals} onCategoryClick={(categoryId) => updateQueryState({ categoryId: String(categoryId), page: 1 })} onMealClick={(mealId) => updateQueryState({ mealId: String(mealId), page: 1 })} onMenuAllClick={(name) => updateQueryState(name === "categoryId" ? { categoryId: "", page: 1 } : { mealId: "", page: 1 })} onChangeSearchTerm={(event: ChangeEvent<HTMLInputElement>) => updateQueryState({ q: event.target.value, page: 1 })} onClearFilters={() => updateQueryState({ q: "", categoryId: "", mealId: "", filter: "", page: 1 })} /></div>
						<section className="min-w-0">
							<form role="search" className="mb-4 grid gap-2 lg:hidden" onSubmit={(event) => event.preventDefault()}><label htmlFor="food-mobile-search" className="sr-only">Search recipes</label><Input id="food-mobile-search" type="search" value={queryState.q} placeholder="Name or keyword…" onChange={(event) => updateQueryState({ q: event.target.value, page: 1 })} /></form>
							<div className="mb-4 flex items-center justify-end gap-3 lg:hidden"><Button variant="outline" size="icon" className="relative size-11" onClick={() => setIsFilterSheetOpen(true)} aria-label={`Filters${activeFilterCount ? ` (${activeFilterCount})` : ""}`} title="Filter recipes" aria-haspopup="dialog" aria-expanded={isFilterSheetOpen}><SlidersHorizontal className="size-4" aria-hidden="true" />{activeFilterCount ? <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[0.65rem] font-black text-primary-foreground" aria-hidden="true">{activeFilterCount}</span> : null}</Button></div>
							<div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Recipe quick filters">{RECIPE_FILTER_OPTIONS.map(({ value, label }) => <button key={value} type="button" className={`min-h-11 min-w-11 rounded-full border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${queryState.filter === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-secondary"}`} aria-pressed={queryState.filter === value} onClick={() => updateQueryState({ filter: queryState.filter === value ? "" : value, page: 1 })}>{label}</button>)}</div>
							<ActiveFilterChips queryState={queryState} categories={categories} meals={meals} filterOptions={RECIPE_FILTER_OPTIONS} onQueryStateChange={updateQueryState} onClearFilters={() => updateQueryState({ q: "", categoryId: "", mealId: "", filter: "", page: 1 })} />
							<Suspense fallback={<PageState title="Loading recipes" message="Preparing the recipe list." />}><FoodContent recipes={recipesQuery.data?.recipes ?? []} pagination={recipesQuery.data?.pagination} queryState={queryState} onQueryStateChange={updateQueryState} isLoading={recipesQuery.isPending} isFetching={recipesQuery.isFetching} error={getApiErrorMessage(recipesQuery.error, "Unable to load recipes.")} onRetry={() => { void recipesQuery.refetch(); }} /></Suspense>
						</section>
					</div>
				)}
			</div>
			<FilterSheet open={isFilterSheetOpen} queryState={queryState} categories={categories} meals={meals} filterOptions={RECIPE_FILTER_OPTIONS} onQueryStateChange={updateQueryState} onClearFilters={() => updateQueryState({ q: "", categoryId: "", mealId: "", filter: "", page: 1 })} onClose={() => setIsFilterSheetOpen(false)} />
		</main>
	);
};

export default Food;
