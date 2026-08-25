import React, { Suspense, lazy, useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { parseRecipeDiscoveryState, useRecipesQuery } from "@/features/food/api/useRecipesQuery";
import { RECIPE_FILTER_OPTIONS } from "./filterOptions";

const FoodContent = lazy(() => import("@/features/food/FoodContent"));

const Food = () => {
	const [categories, setCategories] = useState([]);
	const [meals, setMeals] = useState([]);
	const [filtersError, setFiltersError] = useState(null);
	const [isLoadingFilters, setIsLoadingFilters] = useState(true);
	const navigate = useNavigate();
	const location = useLocation();
	const queryState = parseRecipeDiscoveryState(location.search);
	const recipesQuery = useRecipesQuery(queryState);
	const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
	const activeFilterCount = [queryState.q, queryState.categoryId, queryState.mealId, queryState.filter].filter(Boolean).length;

	const updateQueryState = (changes) => {
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
		const fetchFilters = async () => {
			try {
				setIsLoadingFilters(true);
				setFiltersError(null);
				const [categoryResponse, mealResponse] = await Promise.all([axios.get(apiRoutes.categories), axios.get(apiRoutes.meals)]);
				setCategories(getArrayPayload(categoryResponse.data, "categories"));
				setMeals(getArrayPayload(mealResponse.data, "meals"));
			} catch (err) {
				console.error(err);
				setFiltersError(err.response?.data?.message || "Unable to load recipe filters.");
			} finally {
				setIsLoadingFilters(false);
			}
		};
		fetchFilters();
	}, []);

	const filtersReady = !isLoadingFilters && !filtersError;
	return (
		<main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
			<PageHelmet title="Recipes" description="Search, filter, and compare recipes by category, meal type, name, and rating." path="/food" />
			<div className="mx-auto w-full max-w-[96rem]">
				<section className="mb-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
					<div className="max-w-3xl">
						<p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-primary">Recipe finder</p>
						<h1 className="text-3xl font-black tracking-[-0.035em] text-foreground sm:text-4xl lg:text-5xl">Find something worth cooking</h1>
						<p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Search by name, narrow by category or meal, then compare recipes without losing your place.</p>
					</div>
					<div className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="Recipe library summary">
						{[[recipesQuery.data?.pagination?.total ?? recipesQuery.data?.recipes.length ?? 0, "Recipes"], [categories.length, "Categories"], [meals.length, "Meals"]].map(([value, label]) => (
							<Card key={label} className="min-w-0 p-3 text-center sm:min-w-28 sm:p-4"><strong className="block text-xl font-black text-foreground sm:text-2xl">{value}</strong><span className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</span></Card>
						))}
					</div>
				</section>

				{!filtersReady ? <PageState type={filtersError ? "error" : undefined} title={filtersError ? "Recipe filters could not load" : "Loading recipe filters"} message={filtersError || "Fetching categories and meal filters."} /> : (
					<div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[304px_minmax(0,1fr)]">
						<div className="hidden lg:block"><FoodMenuBar categoryId={queryState.categoryId} mealId={queryState.mealId} searchTerm={queryState.q} categories={categories} meals={meals} onCategoryClick={(categoryId) => updateQueryState({ categoryId, page: 1 })} onMealClick={(mealId) => updateQueryState({ mealId, page: 1 })} onMenuAllClick={(name) => updateQueryState({ [name]: "", page: 1 })} onChangeSearchTerm={(event) => updateQueryState({ q: event.target.value, page: 1 })} onClearFilters={() => updateQueryState({ q: "", categoryId: "", mealId: "", filter: "", page: 1 })} /></div>
						<section className="min-w-0">
							<form role="search" className="mb-4 grid gap-2 lg:hidden" onSubmit={(event) => event.preventDefault()}><label htmlFor="food-mobile-search" className="text-sm font-bold">Search recipes</label><Input id="food-mobile-search" type="search" value={queryState.q} placeholder="Name or keyword…" onChange={(event) => updateQueryState({ q: event.target.value, page: 1 })} /></form>
							<div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
								<Button variant="outline" className="w-full justify-center sm:w-auto" onClick={() => setIsFilterSheetOpen(true)} aria-haspopup="dialog" aria-controls="food-filter-sheet"><SlidersHorizontal className="size-4" />Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}</Button>
							</div>
							<div className="mb-4 flex flex-wrap gap-2" aria-label="Recipe quick filters">{RECIPE_FILTER_OPTIONS.map(({ value, label }) => <button key={value} type="button" className={`min-h-11 min-w-11 rounded-full border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${queryState.filter === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-secondary"}`} aria-pressed={queryState.filter === value} onClick={() => updateQueryState({ filter: queryState.filter === value ? "" : value, page: 1 })}>{label}</button>)}</div>
							<ActiveFilterChips queryState={queryState} categories={categories} meals={meals} filterOptions={RECIPE_FILTER_OPTIONS} onQueryStateChange={updateQueryState} onClearFilters={() => updateQueryState({ q: "", categoryId: "", mealId: "", filter: "", page: 1 })} />
							<Suspense fallback={<PageState title="Loading recipes" message="Preparing the recipe list." />}><FoodContent recipes={recipesQuery.data?.recipes || []} pagination={recipesQuery.data?.pagination} queryState={queryState} onQueryStateChange={updateQueryState} isLoading={recipesQuery.isPending} isFetching={recipesQuery.isFetching} error={recipesQuery.error?.response?.data?.message || recipesQuery.error?.message} /></Suspense>
						</section>
					</div>
				)}
			</div>
			<FilterSheet open={isFilterSheetOpen} queryState={queryState} categories={categories} meals={meals} filterOptions={RECIPE_FILTER_OPTIONS} onQueryStateChange={updateQueryState} onClearFilters={() => updateQueryState({ q: "", categoryId: "", mealId: "", filter: "", page: 1 })} onClose={() => setIsFilterSheetOpen(false)} />
		</main>
	);
};
export default Food;
