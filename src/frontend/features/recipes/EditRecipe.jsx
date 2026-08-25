import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHelmet from "@/shared/seo/PageHelmet";
import PageState from "@/shared/ui/PageState";
import RecipeEditor from "./RecipeEditor";
import { OWNED_RECIPE_NOT_FOUND, loadOwnedRecipe } from "./editRecipeApi";

const parseRecipeId = (value) => {
	if (!/^[1-9]\d*$/.test(value || "")) return null;

	const recipeId = Number(value);
	return Number.isSafeInteger(recipeId) ? recipeId : null;
};

const getErrorKind = (error) => {
	if (error?.code === OWNED_RECIPE_NOT_FOUND) return "not-found";
	if (error?.response?.status === 403) return "forbidden";
	return "error";
};

const EditRecipe = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const recipeId = useMemo(() => parseRecipeId(searchParams.get("id")), [searchParams]);
	const [state, setState] = useState({ kind: recipeId ? "loading" : "invalid", recipe: null, error: null });

	const loadRecipe = useCallback(async () => {
		if (!recipeId) {
			setState({ kind: "invalid", recipe: null, error: null });
			return;
		}

		setState({ kind: "loading", recipe: null, error: null });
		try {
			const recipe = await loadOwnedRecipe(recipeId);
			setState({ kind: "ready", recipe, error: null });
		} catch (error) {
			setState({ kind: getErrorKind(error), recipe: null, error });
		}
	}, [recipeId]);

	useEffect(() => {
		loadRecipe();
	}, [loadRecipe]);

	const returnToProfile = () => navigate("/profile");

	let content;
	if (state.kind === "loading") {
		content = <PageState title="Loading your recipe" message="Checking your cookbook for this recipe." />;
	} else if (state.kind === "invalid" || state.kind === "not-found") {
		content = <PageState type="error" title="Recipe not found" message="This recipe is no longer available in your cookbook." actionLabel="Back to profile" onAction={returnToProfile} />;
	} else if (state.kind === "forbidden") {
		content = <PageState type="error" title="You cannot edit this recipe" message="Your account does not have permission to edit this recipe." actionLabel="Back to profile" onAction={returnToProfile} />;
	} else if (state.kind === "error") {
		content = <PageState type="error" title="Recipe could not load" message={state.error?.response?.data?.message || "Please try again."} actionLabel="Try again" onAction={loadRecipe} />;
	} else {
		content = <RecipeEditor mode="edit" recipeId={recipeId} initialRecipe={state.recipe} onSaved={({ recipe }) => navigate(`/recipe?id=${recipe.recipe_id}`)} />;
	}

	return (
		<main>
			<PageHelmet title="Edit Recipe" description="Edit a recipe from your cookbook." path="/food/edit" noIndex />
			{content}
		</main>
	);
};

export default EditRecipe;
