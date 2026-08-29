import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import axios from "@/shared/api/axios";
import type { RecipeDetail, RecipeMetadata } from "@/shared/api/contracts";
import { apiRoutes, getUserRecipeRatingRoute } from "@/shared/api/routes";
import {
	isWishlistAddSuccess,
	serializeWishlistPayload,
} from "@/shared/api/mutations";
import RecipeContainerSummary from "@/features/recipes/RecipeContainerSummary";
import RecipeContent from "@/features/recipes/RecipeContent";
import RecipeOtherList from "@/features/recipes/RecipeOtherList";
import CookingMode from "@/features/recipes/cooking/CookingMode";
import { useCookingSession } from "@/features/recipes/cooking/useCookingSession";
import { clearCookingToolsState, getCookingToolsStorageKey } from "@/features/recipes/cooking/cookingToolsStorage";
import { useAddRecipeIngredientsMutation, usePrepareRecipeIngredientsMutation } from "@/features/shopping/api/shoppingQueries";
import type { PrepareRecipeResponse } from "@/features/shopping/api/shoppingApi";
import PreparationSummary from "@/features/shopping/PreparationSummary";
import type {
	CookingCompletionAction,
	CookingSessionCompletionResponse,
	CookingShoppingListResponse,
} from "@/features/history/api/cookingSessionApi";
import AddToPlanDialog from "@/features/planning/components/AddToPlanDialog";
import PageHelmet from "@/shared/seo/PageHelmet";
import PageState from "@/shared/ui/PageState";
import { AuthContext } from "@/app/AuthProvider";
import { useToast } from "@/app/ToastProvider";
import { getArrayPayload } from "@/shared/api/payload";
import ErrorPage from "@/features/content/ErrorPage";
import PrivateRecipeNotes from "@/features/recipes/notes/PrivateRecipeNotes";
import { recordRecentlyViewedRecipe } from "@/features/recipes/recentlyViewed";
import PrintRecipeButton from "@/features/recipes/share/PrintRecipeButton";
import ShareRecipeButton from "@/features/recipes/share/ShareRecipeButton";
import { refreshKitchenQueries } from "./recipeKitchenQueries";
import {
	beginAuthIntent,
	isMatchingSaveRecipeIntent,
	isMatchingSaveToCollectionIntent,
	isMatchingAddToPlanIntent,
	isMatchingAddIngredientsIntent,
	isMatchingPrepareMealIntent,
} from "@/features/auth/returnIntent";
import {
	useAddRecipeToCollectionMutation,
	useCollectionsQuery,
} from "@/features/saved/api/collectionsQueries";
import CollectionRecipeDialog from "@/features/saved/collections/CollectionRecipeDialog";
import "./Recipe.print.scss";

type RecipeReadRecipe = Omit<Partial<RecipeDetail>,
	| "recipe_id"
	| "recipe_name"
	| "recipe_description"
	| "ingredients"
	| "instructions"
	| "metadata"
> & {
	recipe_id: number;
	recipe_name?: string | null;
	recipe_description?: string | null;
	ingredients?: string[] | null;
	instructions?: string[] | null;
	metadata?: RecipeMetadata | null;
};

type RecipeReview = {
	rating_id: number | string;
	score?: number | string | null;
	review?: string | null;
	full_name?: string | null;
	date_added?: string | null;
};

type ReviewMessage = {
	type: "error" | "success";
	text: string;
};

type WishlistItem = {
	recipe_id?: number | string | null;
	recipe?: { recipe_id?: number | string | null } | null;
};

type UserRating = {
	recipe_id: number | string;
	score?: number | string | null;
	review?: string | null;
};

type CookingSessionState = {
	current_step?: number;
};

type CookingSessionControls = {
	session: CookingSessionState | null;
	isReady: boolean;
	error: string | null;
	updateProgress: (stepIndex: number) => void;
	pause: () => Promise<void>;
	complete: (action?: CookingCompletionAction) => Promise<CookingSessionCompletionResponse | CookingShoppingListResponse | null>;
};

type CollectionDialogProps = {
	open: boolean;
	recipeName: string;
	collections: Array<{ collection_id: number; name: string }>;
	isLoading: boolean;
	isSubmitting: boolean;
	pendingCollectionId: number | null;
	errorMessage: string | null;
	onAdd: (collectionId: number) => void;
	onClose: () => void;
};

const CollectionRecipeDialogAdapter = (props: CollectionDialogProps): React.ReactElement | null => (
	<CollectionRecipeDialog {...props} />
);

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const getErrorMessage = (error: unknown, fallback: string): string => {
	if (isAxiosError(error) && isRecord(error.response?.data) && typeof error.response.data.message === "string") {
		return error.response.data.message;
	}
	return fallback;
};

const isRecipeReview = (value: unknown): value is RecipeReview =>
	isRecord(value) && (typeof value.rating_id === "number" || typeof value.rating_id === "string");

const isWishlistItem = (value: unknown): value is WishlistItem =>
	isRecord(value) && (value.recipe_id === undefined || value.recipe_id === null || typeof value.recipe_id === "number" || typeof value.recipe_id === "string");

const isUserRating = (value: unknown): value is UserRating =>
	isRecord(value) && (typeof value.recipe_id === "number" || typeof value.recipe_id === "string");

const Recipe = (): React.ReactElement => {
	const { auth } = useContext(AuthContext);
	const { isAuthenticated, userId } = auth.current;
	const [recipe, setRecipe] = useState<RecipeReadRecipe | null>(null);
	const [isLoadingRecipe, setIsLoadingRecipe] = useState(true);
	const [recipeError, setRecipeError] = useState<string | null>(null);
	const [favorite, setFavorite] = useState(false);
	const [favoriteLoadedKey, setFavoriteLoadedKey] = useState<string | null>(null);
	const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);
	const [ratingScore, setRatingScore] = useState(0);
	const [hasExistingRating, setHasExistingRating] = useState(false);
	const [review, setReview] = useState("");
	const [showReview, setShowReview] = useState(false);
	const [reviewList, setReviewList] = useState<RecipeReview[]>([]);
	const [isLoadingReviews, setIsLoadingReviews] = useState(false);
	const [reviewsError, setReviewsError] = useState<string | null>(null);
	const [isSubmittingReview, setIsSubmittingReview] = useState(false);
	const [isDeletingReview, setIsDeletingReview] = useState(false);
	const [reviewMessage, setReviewMessage] = useState<ReviewMessage | null>(null);
	const [isAddToPlanOpen, setIsAddToPlanOpen] = useState(false);
	const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
	const [collectionDialogError, setCollectionDialogError] = useState<string | null>(null);
	const [pendingCollectionId, setPendingCollectionId] = useState<number | null>(null);
	const [preparationResult, setPreparationResult] = useState<PrepareRecipeResponse | null>(null);
	const { showToast } = useToast();
	const navigate = useNavigate();
	const addIngredientsMutation = useAddRecipeIngredientsMutation();
	const prepareRecipeMutation = usePrepareRecipeIngredientsMutation();
	const collectionsQuery = useCollectionsQuery(isAuthenticated);
	const addRecipeToCollectionMutation = useAddRecipeToCollectionMutation();
	const canDeleteReview = true;
	const canMutateReview = true;

	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const id = searchParams.get("id");
	const isCookingMode = location.pathname === "/recipe/cooking";
	const planningDate = searchParams.get("date");
	const planningSlot = searchParams.get("slot");
	const planningServings = Number(searchParams.get("servings"));
	const planningItemId = searchParams.get("planItemId");
	const requestedReturnTo = searchParams.get("returnTo");
	const safeReturnTo =
		requestedReturnTo?.startsWith("/") && !requestedReturnTo.startsWith("//")
			? requestedReturnTo
			: "/planning";
	const planningContext =
		planningItemId &&
		planningDate &&
		planningSlot &&
		Number.isInteger(planningServings) &&
		planningServings > 0
			? {
					date: planningDate,
					slot: planningSlot,
					servings: Math.min(planningServings, 24),
					planItemId: Number(planningItemId),
					returnTo: safeReturnTo,
			  }
			: null;
	const cookingToolsStorageKey = recipe
		? getCookingToolsStorageKey(isAuthenticated ? userId : 0, recipe.recipe_id)
		: null;
	const cookingSession: CookingSessionControls = useCookingSession({
		enabled: isCookingMode && Boolean(recipe),
		userId: isAuthenticated ? userId : 0,
		recipeId: recipe?.recipe_id,
		mealPlanItemId: planningContext?.planItemId,
		servings: planningContext?.servings ?? recipe?.nutrition?.servings ?? 1,
	});
	const queryClient = useQueryClient();
	const currentPath = `${location.pathname}${location.search}${location.hash}`;
	const processedAuthIntent = useRef<unknown>(null);
	const favoriteLoadKey =
		isAuthenticated
			? userId && recipe
				? `user:${userId}:recipe:${recipe.recipe_id}`
				: "authenticated-pending"
			: "guest";
	const isFavoriteLoaded = favoriteLoadedKey === favoriteLoadKey;

	const fetchRecipe = useCallback(async ({ showLoading = true }: { showLoading?: boolean } = {}): Promise<void> => {
		if (!id) return;

		try {
			if (showLoading) setIsLoadingRecipe(true);
			setRecipeError(null);
			const response = await axios.get<{ recipe: RecipeReadRecipe }>(apiRoutes.recipe(id));
			if (response.status === 200) {
				setRecipe(response.data.recipe);
			}
		} catch (error: unknown) {
			console.error(error);
			setRecipeError(getErrorMessage(error, "Unable to load this recipe."));
		} finally {
			if (showLoading) setIsLoadingRecipe(false);
		}
	}, [id]);

	const handleStarClick = (clickedRating: number): void => {
		setRatingScore(clickedRating);
	};

	const handleToggleReview = () => {
		setShowReview((showReview) => !showReview);
	};

	const handleReviewChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
		setReview(event.target.value.slice(0, 500));
	};

	const fetchReviews = useCallback(async (recipeId: number): Promise<void> => {
		if (!recipeId) return;

		try {
			setIsLoadingReviews(true);
			setReviewsError(null);
			const response = await axios.get<unknown>(apiRoutes.recipeReviews(recipeId));
			if (response.status === 200) {
				setReviewList(getArrayPayload<RecipeReview>(response.data, "reviews", isRecipeReview));
			}
		} catch (error: unknown) {
			console.error(error);
			setReviewsError(getErrorMessage(error, "Unable to load reviews."));
		} finally {
			setIsLoadingReviews(false);
		}
	}, []);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();

		if (!isAuthenticated) {
			navigate("/account");
			return;
		}

		if (!recipe || !canMutateReview) return;

		if (!ratingScore) {
			setReviewMessage({
				type: "error",
				text: "Choose a star rating before submitting your review.",
			});
			return;
		}

		setIsSubmittingReview(true);
		setReviewMessage(null);

		try {
			await axios.put(
				getUserRecipeRatingRoute(recipe.recipe_id),
				{
					score: ratingScore,
					review: review.trim(),
				}
			);
			setHasExistingRating(true);
			await fetchRecipe({ showLoading: false });
			await fetchReviews(recipe.recipe_id);
			setReviewMessage({
				type: "success",
				text: hasExistingRating
					? "Your review has been updated."
					: "Your rating and review have been saved.",
			});
			showToast({ title: hasExistingRating ? "Review updated" : "Review saved" });
		} catch (error: unknown) {
			console.error(error);
			setReviewMessage({
				type: "error",
				text: "We could not save your review. Please try again.",
			});
			showToast({ title: "Couldn’t save your review", message: "Please try again.", type: "error" });
		} finally {
			setIsSubmittingReview(false);
		}
	};

	const handleDeleteReview = async () => {
		if (
			!isAuthenticated ||
			!recipe ||
			!hasExistingRating ||
			!canMutateReview ||
			!canDeleteReview
		) {
			return;
		}

		setIsDeletingReview(true);
		setReviewMessage(null);
		try {
			await axios.delete(
				apiRoutes.userRecipeRatingDelete(recipe.recipe_id)
			);
			setRatingScore(0);
			setReview("");
			setShowReview(false);
			setHasExistingRating(false);
			await fetchRecipe({ showLoading: false });
			await fetchReviews(recipe.recipe_id);
			setReviewMessage({
				type: "success",
				text: "Your review has been deleted.",
			});
			showToast({ title: "Review deleted" });
		} catch (error: unknown) {
			console.error(error);
			setReviewMessage({
				type: "error",
				text: "We could not delete your review. Please try again.",
			});
			showToast({ title: "Couldn’t delete your review", message: "Please try again.", type: "error" });
		} finally {
			setIsDeletingReview(false);
		}
	};

	const handleClickFavorite = async (event?: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
		event?.preventDefault();
		if (!isAuthenticated) {
			beginAuthIntent({
				returnTo: currentPath,
				action: "saveRecipe",
				recipeId: recipe?.recipe_id,
			});
			navigate("/account?signup=false", {
				state: { from: currentPath },
			});
			return;
		}
		if (!recipe || isUpdatingFavorite) return;

		try {
			setIsUpdatingFavorite(true);
			if (favorite) {
				const response = await axios.delete(
					apiRoutes.userWishlistItem(recipe.recipe_id)
				);
				if (response.status === 200) {
					setFavorite(false);
					showToast({ title: "Removed from Saved" });
				}
			} else {
				const response = await axios.post(
					apiRoutes.userWishlist,
					serializeWishlistPayload(recipe.recipe_id)
				);
				if (isWishlistAddSuccess(response.status)) {
					setFavorite(true);
					showToast({ title: "Saved recipe" });
				}
			}
		} catch (error: unknown) {
			console.error(error);
			showToast({
				title: "Couldn’t update Saved",
				message: "Please try again in a moment.",
				type: "error",
			});
		} finally {
			setIsUpdatingFavorite(false);
		}
	};

	const handleAddIngredientsToShoppingList = () => {
		if (!isAuthenticated) {
			beginAuthIntent({ returnTo: currentPath, action: "addIngredients", recipeId: recipe?.recipe_id });
			navigate("/account?signup=false", { state: { from: currentPath } });
			return;
		}
		if (!recipe || addIngredientsMutation.isPending) return;

		addIngredientsMutation.mutate(recipe.recipe_id);
	};

	const handlePrepareMeal = () => {
		if (!isAuthenticated) {
			beginAuthIntent({ returnTo: currentPath, action: "prepareMeal", recipeId: recipe?.recipe_id });
			navigate("/account?signup=false", { state: { from: currentPath } });
			return;
		}
		if (!recipe || prepareRecipeMutation.isPending) return;
		setPreparationResult(null);
		prepareRecipeMutation.mutate(
			{ recipeId: recipe.recipe_id, servings: Number(recipe.nutrition?.servings ?? 1) },
			{ onSuccess: setPreparationResult },
		);
	};

	const handleCookingComplete = async (action?: CookingCompletionAction): Promise<CookingSessionCompletionResponse | CookingShoppingListResponse | null> => {
		if (!recipe) return null;
		const completedSession = await cookingSession.complete(action);
		if (completedSession) {
			if ("status" in completedSession && completedSession.status === "shopping_list_updated") {
				showToast({ title: "Missing ingredients added to shopping list" });
			} else {
				clearCookingToolsState(cookingToolsStorageKey);
				showToast({ title: "Cooking history saved" });
			}
			await refreshKitchenQueries(queryClient);
			return completedSession;
		}
		clearCookingToolsState(cookingToolsStorageKey);
		await refreshKitchenQueries(queryClient);
		return null;
	};

	const handleCookingPause = async (): Promise<void> => {
		await cookingSession.pause();
		await queryClient.invalidateQueries({ queryKey: ["home-feed"] });
	};

	const handleAddToPlan = () => {
		if (!isAuthenticated) {
			beginAuthIntent({ returnTo: currentPath, action: "addToPlan", recipeId: recipe?.recipe_id });
			navigate("/account?signup=false", { state: { from: currentPath } });
			return;
		}
		setIsAddToPlanOpen(true);
	};

	const handleSaveToCollection = () => {
		if (!isAuthenticated) {
			beginAuthIntent({
				returnTo: currentPath,
				action: "saveToCollection",
				recipeId: recipe?.recipe_id,
			});
			navigate("/account?signup=false", { state: { from: currentPath } });
			return;
		}
		setCollectionDialogError(null);
		setIsCollectionDialogOpen(true);
	};

	const handleAddRecipeToCollection = (collectionId: number): void => {
		if (!recipe || addRecipeToCollectionMutation.isPending) return;
		setPendingCollectionId(collectionId);
		setCollectionDialogError(null);
		addRecipeToCollectionMutation.mutate(
			{ collectionId, recipeId: Number(recipe.recipe_id) },
			{
				onError: (error: unknown) => {
					setCollectionDialogError(getErrorMessage(error, "We could not save this recipe to that collection. Try again."));
				},
				onSettled: () => setPendingCollectionId(null),
			},
		);
	};

	const handleRecipeAddedToPlan = () => {
		setIsAddToPlanOpen(false);
		showToast({ title: `Added ${recipe?.recipe_name || "recipe"} to your plan` });
	};
	useEffect(() => {
		const locationState = isRecord(location.state) ? location.state : null;
		const intent = locationState?.pendingAuthIntent;
		if (!isAuthenticated || !recipe || processedAuthIntent.current === intent) {
			return;
		}

		if (isMatchingSaveRecipeIntent(intent, currentPath, recipe.recipe_id)) {
			if (!isFavoriteLoaded) return;
			processedAuthIntent.current = intent;
			navigate(currentPath, { replace: true, state: null });
			if (!favorite) handleClickFavorite();
			return;
		}

		if (isMatchingSaveToCollectionIntent(intent, currentPath, recipe.recipe_id)) {
			processedAuthIntent.current = intent;
			navigate(currentPath, { replace: true, state: null });
			setCollectionDialogError(null);
			setIsCollectionDialogOpen(true);
			return;
		}

		if (isMatchingAddToPlanIntent(intent, currentPath, recipe.recipe_id)) {
			processedAuthIntent.current = intent;
			navigate(currentPath, { replace: true, state: null });
			setIsAddToPlanOpen(true);
			return;
		}

		if (isMatchingAddIngredientsIntent(intent, currentPath, recipe.recipe_id)) {
			processedAuthIntent.current = intent;
			navigate(currentPath, { replace: true, state: null });
			handleAddIngredientsToShoppingList();
			return;
		}

		if (isMatchingPrepareMealIntent(intent, currentPath, recipe.recipe_id)) {
			processedAuthIntent.current = intent;
			navigate(currentPath, { replace: true, state: null });
			handlePrepareMeal();
		}
	}, [currentPath, favorite, handleAddIngredientsToShoppingList, handleClickFavorite, handlePrepareMeal, isAuthenticated, isFavoriteLoaded, location.state, navigate, recipe]);
	useEffect(() => {
		fetchRecipe();
	}, [fetchRecipe]);

	useEffect(() => {
		const fetchFavorites = async () => {
			setFavoriteLoadedKey(null);
			if (!isAuthenticated || !userId || !recipe) {
				setFavorite(false);
				setFavoriteLoadedKey(isAuthenticated ? "authenticated-pending" : "guest");
				return;
			}

			try {
				const response = await axios.get<unknown>(apiRoutes.userWishlist);
				if (response.status === 200) {
					setFavorite(
						getArrayPayload<WishlistItem>(response.data, "wishlist", isWishlistItem).some(
							(wishlistRecipe) =>
								Number(
									wishlistRecipe.recipe?.recipe_id ??
										wishlistRecipe.recipe_id
								) ===
								Number(recipe.recipe_id)
						)
					);
				}
			} catch (error: unknown) {
				console.error(error);
			} finally {
				setFavoriteLoadedKey(`user:${userId}:recipe:${recipe.recipe_id}`);
			}
		};
		fetchFavorites();
	}, [isAuthenticated, recipe, userId]);
	useEffect(() => {
		const fetchRating = async () => {
			if (!isAuthenticated || !recipe) {
				setRatingScore(0);
				setHasExistingRating(false);
				setReview("");
				return;
			}

			try {
				const response = await axios.get<unknown>(apiRoutes.userRatings);
				if (response.status === 200) {
					const myRecipeRating = getArrayPayload(
						response.data,
						"ratings",
						isUserRating,
					).find(
						(rating) =>
							Number(rating.recipe_id) === Number(recipe.recipe_id)
					);

					setRatingScore(Number(myRecipeRating?.score || 0));
					setHasExistingRating(Boolean(myRecipeRating));
					setReview(myRecipeRating?.review || "");
					setShowReview(Boolean(myRecipeRating?.review));
				}
			} catch (error: unknown) {
				console.error(error);
			}
		};
		fetchRating();
	}, [isAuthenticated, recipe, userId]);
	useEffect(() => {
		if (!recipe) return;
		recordRecentlyViewedRecipe(window.localStorage, Number(recipe.recipe_id));

		fetchReviews(recipe.recipe_id).catch((error: unknown) => console.error(error));
	}, [fetchReviews, recipe]);
	if (!id) {
		return <ErrorPage />;
	}
	return (
		<>
			<PageHelmet
				title={recipe?.recipe_name || "Recipe"}
				description={
					recipe?.recipe_description ||
					"Read recipe details, cooking time, ratings, and community reviews."
				}
				path={`/recipe?id=${id}`}
				type="article"
			/>
			{isLoadingRecipe ? (
				<PageState
					title="Loading recipe"
					message="Fetching recipe details, ratings, and reviews."
				/>
			) : recipeError ? (
				<PageState
					type="error"
					title="Recipe could not load"
					message={recipeError}
					actionLabel="Back to recipes"
					onAction={() => navigate("/food")}
				/>
			) : recipe && isCookingMode ? (
				<CookingMode
					recipe={{
						recipe_id: recipe.recipe_id,
						recipe_name: recipe.recipe_name ?? undefined,
						instructions: recipe.instructions ?? undefined,
						structured_ingredients: recipe.structured_ingredients ?? undefined,
						ingredients: recipe.ingredients ?? undefined,
					}}
					planningContext={planningContext || undefined}
					onComplete={handleCookingComplete}
					initialStepIndex={cookingSession.session?.current_step ?? 0}
					isSessionReady={cookingSession.isReady}
					sessionError={cookingSession.error}
					onStepChange={cookingSession.updateProgress}
					onPause={handleCookingPause}
					toolsStorageKey={cookingToolsStorageKey}
					onBackToPlan={
						planningContext
							? () => navigate(planningContext.returnTo || "/planning")
							: undefined
					}
					onExit={() => navigate(`/recipe?id=${encodeURIComponent(id)}`)}
				/>
			) : recipe && (
				<main className="recipe-print min-h-screen bg-background text-foreground">
					<div className="recipe-print__summary">
						<RecipeContainerSummary
							recipe={{ ...recipe, recipe_name: recipe.recipe_name ?? "Recipe" }}
							favorite={favorite}
							onClickFavorite={handleClickFavorite}
							onSaveToCollection={handleSaveToCollection}
								onAddToPlan={handleAddToPlan}
								onPrepareMeal={handlePrepareMeal}
								isPreparingMeal={prepareRecipeMutation.isPending}
								onAddIngredients={handleAddIngredientsToShoppingList}
							isAddingIngredients={addIngredientsMutation.isPending}
						/>
						{preparationResult && <div className="mx-auto w-full max-w-[100rem] px-4 pb-2 sm:px-6 lg:px-8 2xl:max-w-[108rem]"><PreparationSummary result={preparationResult} /></div>}
					</div>
					<div className="recipe-print__utilities mx-auto flex w-full max-w-[100rem] justify-end px-4 pb-2 sm:px-6 lg:px-8 2xl:max-w-[108rem]" data-print-hidden>
				<div className="flex items-center gap-1 rounded-xl border border-border/70 bg-card/80 p-1 shadow-sm" role="group" aria-label="Recipe utilities">
							<ShareRecipeButton
								recipeId={recipe.recipe_id}
								recipeName={recipe.recipe_name ?? "Recipe"}
								description={recipe.recipe_description || ""}
								className="border-transparent bg-transparent text-foreground shadow-none hover:bg-muted/50 hover:text-foreground"
							/>
							<PrintRecipeButton className="border-transparent bg-transparent text-foreground shadow-none hover:bg-muted/50 hover:text-foreground" />
						</div>
					</div>
					<div className="recipe-print__dialogs" data-print-hidden>
						<AddToPlanDialog
							open={isAddToPlanOpen}
							recipe={{ recipe_id: recipe.recipe_id, recipe_name: recipe.recipe_name ?? "Recipe" }}
							onClose={() => setIsAddToPlanOpen(false)}
							onAdded={handleRecipeAddedToPlan}
						/>
						<CollectionRecipeDialogAdapter
							open={isCollectionDialogOpen}
							recipeName={recipe.recipe_name ?? "Recipe"}
							collections={collectionsQuery.data?.collections ?? []}
							isLoading={collectionsQuery.isLoading}
							isSubmitting={addRecipeToCollectionMutation.isPending}
							pendingCollectionId={pendingCollectionId}
							errorMessage={
								collectionDialogError ||
								(collectionsQuery.isError
									? "Unable to load your collections. Try again from Saved Recipes."
									: null)
							}
							onAdd={handleAddRecipeToCollection}
							onClose={() => {
								if (!addRecipeToCollectionMutation.isPending) {
									setIsCollectionDialogOpen(false);
									setCollectionDialogError(null);
								}
							}}
						/>
					</div>
					<RecipeContent
						recipe={recipe}
						ratingScore={ratingScore}
						review={review}
						showReview={showReview}
						reviewList={reviewList}
						reviewMessage={reviewMessage}
						hasExistingRating={hasExistingRating}
						isRecipeAuthor={
							Number(recipe.user_id) === Number(userId) &&
							isAuthenticated
						}
						isAuthenticated={isAuthenticated}
						canDeleteReview={canDeleteReview}
						canMutateReview={canMutateReview}
						isLoadingReviews={isLoadingReviews}
						reviewsError={reviewsError}
						isSubmittingReview={isSubmittingReview}
						isDeletingReview={isDeletingReview}
						onSubmit={handleSubmit}
						onDelete={handleDeleteReview}
						onStarClick={handleStarClick}
						onToggleReview={handleToggleReview}
						onReviewChange={handleReviewChange}
					/>
					<div className="recipe-print__private-notes" data-print-hidden>
						<PrivateRecipeNotes recipeId={recipe.recipe_id} isAuthenticated={isAuthenticated} />
					</div>
					<div className="recipe-print__related" data-print-hidden>
						<RecipeOtherList recipeId={recipe.recipe_id} />
					</div>
				</main>
			)}
		</>
	);
};

export default Recipe;
