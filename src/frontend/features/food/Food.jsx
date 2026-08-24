import React, { Suspense, lazy, useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "@/shared/api/axios";
import { getArrayPayload } from "@/shared/api/payload";
import { apiRoutes } from "@/shared/api/routes";
import FoodMenuBar from "@/features/food/FoodMenuBar";
import PageHelmet from "@/shared/seo/PageHelmet";
import PageState from "@/shared/ui/PageState";
import { parseRecipeDiscoveryState, useRecipesQuery } from "@/features/food/api/useRecipesQuery";
import "./Food.scss";

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

	const updateQueryState = (changes) => {
		const nextState = { ...queryState, ...changes };
		const params = new URLSearchParams();
		if (nextState.q) params.set("q", nextState.q);
		if (nextState.categoryId) params.set("categoryId", nextState.categoryId);
		if (nextState.mealId) params.set("mealId", nextState.mealId);
		if (nextState.sort !== "popular") params.set("sort", nextState.sort);
		if (nextState.page !== 1) params.set("page", String(nextState.page));
		if (nextState.limit !== 6) params.set("limit", String(nextState.limit));
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
		<Container as="main" fluid className="fr-page food">
			<PageHelmet title="Recipes" description="Search, filter, and compare recipes by category, meal type, name, and rating." path="/food" />
			<div className="food__intro">
				<div className="food__intro__content"><span>Recipe finder</span><h1>Explore delicious recipes</h1><p>Filter by category, meal type, or search by name to find the right dish faster.</p></div>
				<div className="food__summary" aria-label="Recipe library summary"><div><strong>{recipesQuery.data?.pagination?.total ?? recipesQuery.data?.recipes.length ?? 0}</strong><span>Recipes found</span></div><div><strong>{categories.length}</strong><span>Categories</span></div><div><strong>{meals.length}</strong><span>Meal types</span></div></div>
			</div>
			{!filtersReady ? <PageState type={filtersError ? "error" : undefined} title={filtersError ? "Recipe filters could not load" : "Loading recipe filters"} message={filtersError || "Fetching categories and meal filters."} /> : (
				<Row className="food__layout">
					<Col lg={3} md={4} className="food__layout__aside"><FoodMenuBar categoryId={queryState.categoryId} mealId={queryState.mealId} searchTerm={queryState.q} categories={categories} meals={meals} onCategoryClick={(categoryId) => updateQueryState({ categoryId, page: 1 })} onMealClick={(mealId) => updateQueryState({ mealId, page: 1 })} onMenuAllClick={(name) => updateQueryState({ [name]: "", page: 1 })} onChangeSearchTerm={(event) => updateQueryState({ q: event.target.value, page: 1 })} onClearFilters={() => updateQueryState({ q: "", categoryId: "", mealId: "", page: 1 })} /></Col>
					<Col lg={9} md={8} className="food__layout__content"><Suspense fallback={<PageState title="Loading recipes" message="Preparing the recipe list." />}><FoodContent recipes={recipesQuery.data?.recipes || []} pagination={recipesQuery.data?.pagination} queryState={queryState} onQueryStateChange={updateQueryState} isLoading={recipesQuery.isPending} isFetching={recipesQuery.isFetching} error={recipesQuery.error?.response?.data?.message || recipesQuery.error?.message} /></Suspense></Col>
				</Row>
			)}
		</Container>
	);
};

export default Food;
