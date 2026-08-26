import { useContext, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { isAxiosError } from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "@/shared/api/axios";
import { getArrayPayload } from "@/shared/api/payload";
import { apiRoutes } from "@/shared/api/routes";
import {
	isWishlistAddSuccess,
	serializeWishlistPayload,
} from "@/shared/api/mutations";
import { AuthContext } from "@/app/AuthProvider";
import { RecipeContext } from "@/app/RecipeProvider";
import { useToast } from "@/app/ToastProvider";
import CategorySection, { type HomeCategory } from "./main/CategorySection";
import FoodCardList, { type FeaturedMode, type FeaturedRecipe, type WishlistItem } from "./main/FoodCardList";
import HomeSearchBar from "./main/HomeSearchBar";
import { useHomeSearchQuery } from "./main/api/useHomeSearchQuery";
import PageState from "@/shared/ui/PageState";
import RecentlyViewedRecipes from "@/features/recipes/RecentlyViewedRecipes";
import PantryMatchPanel from "./main/PantryMatchPanel";
import PersonalizedHomeFeed from "./PersonalizedHomeFeed";
import {
	beginAuthIntent,
	isMatchingSaveRecipeIntent,
} from "@/features/auth/returnIntent";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const toHomeCategory = (value: unknown): HomeCategory | null => {
	if (!isRecord(value) || typeof value.id !== "number") return null;
	const name = typeof value.name === "string" ? value.name : value.category_name;
	if (typeof name !== "string" || name.trim().length === 0) return null;

	const recipeCount = value.recipe_count;
	const legacyRecipeCount = value.recipeCount;
	return {
		id: value.id,
		name,
		...(typeof recipeCount === "number" || typeof recipeCount === "string" || recipeCount === null
			? { recipe_count: recipeCount }
			: {}),
		...(typeof legacyRecipeCount === "number" || typeof legacyRecipeCount === "string" || legacyRecipeCount === null
			? { recipeCount: legacyRecipeCount }
			: {}),
	};
};

const toHomeCategories = (payload: unknown): HomeCategory[] =>
	getArrayPayload(payload, "categories")
		.map(toHomeCategory)
		.filter((category): category is HomeCategory => category !== null);

const isWishlistItem = (value: unknown): value is WishlistItem => {
	if (!isRecord(value)) return false;
	const hasFlatId = typeof value.recipe_id === "number";
	const hasNestedId = isRecord(value.recipe) && typeof value.recipe.recipe_id === "number";
	return hasFlatId || hasNestedId;
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
	if (!isAxiosError(error)) return fallback;
	const data = error.response?.data;
	return isRecord(data) && typeof data.message === "string" ? data.message : fallback;
};

const normalizeMinutes = (value: unknown): number | null => {
	const minutes = Number(value);
	return Number.isFinite(minutes) ? minutes : null;
};

const HOME_RECIPE_LIMIT = 4;

type HomeRecipe = FeaturedRecipe & {
	prepTimeMinutes?: number | string | null;
	cookTimeMinutes?: number | string | null;
};

type NormalizedHomeRecipe = HomeRecipe & {
	prepTimeMinutes: number | null;
	cookTimeMinutes: number | null;
	totalTimeMinutes: number;
};

export const normalizeRecipeSummary = (recipe: HomeRecipe): NormalizedHomeRecipe => {
	const prepTimeMinutes = normalizeMinutes(recipe.prepTimeMinutes ?? recipe.prep_time_minutes);
	const cookTimeMinutes = normalizeMinutes(recipe.cookTimeMinutes ?? recipe.cook_time_minutes);

	return {
		...recipe,
		prepTimeMinutes,
		cookTimeMinutes,
		totalTimeMinutes:
			prepTimeMinutes === null || cookTimeMinutes === null
				? Number.MAX_SAFE_INTEGER
				: prepTimeMinutes + cookTimeMinutes,
	};
};

export const byQuickest = (
	a: Pick<NormalizedHomeRecipe, "totalTimeMinutes">,
	b: Pick<NormalizedHomeRecipe, "totalTimeMinutes">,
): number => a.totalTimeMinutes - b.totalTimeMinutes;

export const getQuickMeals = (recipes: HomeRecipe[]): NormalizedHomeRecipe[] =>
	recipes.map(normalizeRecipeSummary).sort(byQuickest).slice(0, HOME_RECIPE_LIMIT);

const HomeMain = (): ReactElement => {
	const [categories, setCategories] = useState<HomeCategory[]>([]);
	const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
	const [wishlistLoadedKey, setWishlistLoadedKey] = useState<string | null>(null);
	const [pendingFavoriteIds, setPendingFavoriteIds] = useState<number[]>([]);
	const [selectedCategoryId, setSelectedCategoryId] = useState<string | number>("all");
	const [featuredMode, setFeaturedMode] = useState<FeaturedMode>("top-rated");
	const [categoryError, setCategoryError] = useState<string | null>(null);
	const { recipes, isLoadingRecipes, recipesError } = useContext(RecipeContext);
	const { auth } = useContext(AuthContext);
	const { isAuthenticated, userId } = auth.current;
	const { showToast } = useToast();
	const navigate = useNavigate();
	const location = useLocation();
	const searchTerm = new URLSearchParams(location.search).get("q") || "";
	const searchQuery = useHomeSearchQuery(searchTerm);
	const processedAuthIntent = useRef<unknown>(null);
	const currentPath = `${location.pathname}${location.search}${location.hash}`;
	const wishlistLoadKey = isAuthenticated
		? userId
			? `user:${userId}`
			: "authenticated-pending"
		: "guest";
	const isWishlistLoaded = wishlistLoadedKey === wishlistLoadKey;

	const filteredRecipes = useMemo<HomeRecipe[]>(() => {
		if (selectedCategoryId === "all") return recipes;
		return recipes.filter(
			(recipe) => Number(recipe.category_id) === Number(selectedCategoryId),
		);
	}, [recipes, selectedCategoryId]);

	const featuredRecipes = useMemo<FeaturedRecipe[]>(() => {
		const nextRecipes: HomeRecipe[] = [...filteredRecipes];

		if (featuredMode === "quick-meals") return getQuickMeals(nextRecipes);
		if (featuredMode === "most-reviewed") {
			return nextRecipes
				.sort((a, b) => Number(b.num_ratings || 0) - Number(a.num_ratings || 0))
				.slice(0, HOME_RECIPE_LIMIT);
		}

		return nextRecipes
			.sort((a, b) => Number(b.overall_score || 0) - Number(a.overall_score || 0))
			.slice(0, HOME_RECIPE_LIMIT);
	}, [featuredMode, filteredRecipes]);

	const handleClickFavorite = async (recipeId: number): Promise<void> => {
		if (!isAuthenticated) {
			beginAuthIntent({ returnTo: currentPath, action: "saveRecipe", recipeId });
			navigate("/account?signup=false", { state: { from: currentPath } });
			return;
		}
		if (pendingFavoriteIds.includes(recipeId)) return;

		const isFavorite = wishlist.some(
			(recipe) => Number(recipe.recipe?.recipe_id ?? recipe.recipe_id) === Number(recipeId),
		);
		setPendingFavoriteIds((currentIds) => [...currentIds, recipeId]);

		try {
			if (isFavorite) {
				const response = await axios.delete(apiRoutes.userWishlistItem(recipeId));
				if (response.status === 200) {
					setWishlist((currentWishlist) =>
						currentWishlist.filter(
							(recipe) => Number(recipe.recipe?.recipe_id ?? recipe.recipe_id) !== Number(recipeId),
						),
					);
					showToast({ title: "Removed from Saved" });
				}
				return;
			}

			const response = await axios.post(
				apiRoutes.userWishlist,
				serializeWishlistPayload(recipeId),
			);
			if (isWishlistAddSuccess(response.status)) {
				setWishlist((currentWishlist) => [...currentWishlist, { recipe_id: recipeId }]);
				showToast({ title: "Saved recipe" });
			}
		} catch (error: unknown) {
			console.error(error);
			showToast({
				title: "Couldn’t update Saved",
				message: "Please try again in a moment.",
				type: "error",
			});
		} finally {
			setPendingFavoriteIds((currentIds) =>
				currentIds.filter((currentId) => currentId !== recipeId),
			);
		}
	};

	useEffect(() => {
		const routeState: unknown = location.state;
		const intent = isRecord(routeState) ? routeState.pendingAuthIntent : undefined;
		const intentRecipeId = isRecord(intent) &&
			(typeof intent.recipeId === "string" || typeof intent.recipeId === "number")
			? intent.recipeId
			: "";

		if (
			!isAuthenticated ||
			!isWishlistLoaded ||
			!isMatchingSaveRecipeIntent(intent, currentPath, intentRecipeId) ||
			!recipes.some((recipe) => Number(recipe.recipe_id) === Number(intentRecipeId)) ||
			processedAuthIntent.current === intent
		) return;

		processedAuthIntent.current = intent;
		navigate(currentPath, { replace: true, state: null });
		const isFavorite = wishlist.some(
			(recipe) => Number(recipe.recipe?.recipe_id ?? recipe.recipe_id) === Number(intentRecipeId),
		);
		if (!isFavorite) void handleClickFavorite(Number(intentRecipeId));
	}, [currentPath, handleClickFavorite, isAuthenticated, isWishlistLoaded, location.state, navigate, recipes, wishlist]);

	useEffect(() => {
		const fetchCategories = async (): Promise<void> => {
			try {
				setCategoryError(null);
				const response = await axios.get<unknown>(apiRoutes.categories);
				setCategories(toHomeCategories(response.data));
			} catch (error: unknown) {
				console.error(error);
				setCategoryError(getApiErrorMessage(error, "Unable to load recipe categories."));
			}
		};
		void fetchCategories();
	}, [userId]);

	useEffect(() => {
		const fetchWishlists = async (): Promise<void> => {
			setWishlistLoadedKey(null);
			if (!isAuthenticated || !userId) {
				setWishlist([]);
				setWishlistLoadedKey(isAuthenticated ? "authenticated-pending" : "guest");
				return;
			}

			try {
				const response = await axios.get<unknown>(apiRoutes.userWishlist);
				if (response.status === 200) {
					setWishlist(getArrayPayload(response.data, "wishlist", isWishlistItem));
				}
			} catch (error: unknown) {
				console.error(error);
			} finally {
				setWishlistLoadedKey(`user:${userId}`);
			}
		};
		void fetchWishlists();
	}, [isAuthenticated, userId]);

	return (
		<div className="mx-auto w-full max-w-[112rem] space-y-8 px-4 pb-6 pt-8 sm:px-6 sm:pt-10 lg:space-y-10 lg:px-10 lg:pb-8">
			{isLoadingRecipes ? (
				<PageState title="Loading recipes" message="Fetching recipes for search and featured cards." />
			) : recipesError ? (
				<PageState type="error" title="Recipes could not load" message={recipesError} />
			) : (
				<>
					<PersonalizedHomeFeed
						isAuthenticated={isAuthenticated}
						wishlist={wishlist}
						onClickFavorite={handleClickFavorite}
					/>
					<PantryMatchPanel />
					<HomeSearchBar
						recipes={recipes}
						searchResults={searchQuery.data?.recipes ?? []}
						isSearchLoading={searchQuery.isFetching}
						searchError={searchQuery.error}
					/>
					{categoryError ? (
						<PageState type="error" title="Categories could not load" message={categoryError} />
					) : (
						<CategorySection
							categories={categories}
							selectedCategoryId={selectedCategoryId}
							onCategorySelect={setSelectedCategoryId}
						/>
					)}
					<FoodCardList
						recipes={featuredRecipes}
						wishlist={wishlist}
						onClickFavorite={handleClickFavorite}
						featuredMode={featuredMode}
						onFeaturedModeChange={setFeaturedMode}
					/>
					<RecentlyViewedRecipes recipes={recipes} />
				</>
			)}
		</div>
	);
};

export default HomeMain;
