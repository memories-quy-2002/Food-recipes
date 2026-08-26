import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";
import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import PageHelmet from "@/shared/seo/PageHelmet";
import PageState from "@/shared/ui/PageState";
import RecipeEditor from "./RecipeEditor";
import { OWNED_RECIPE_NOT_FOUND, loadOwnedRecipe, type RecipeEditorValue } from "./editRecipeApi";
import { useToast } from "@/app/ToastProvider";

type EditStateKind = "loading" | "invalid" | "ready" | "not-found" | "forbidden" | "error";
type EditState =
	| {
		kind: "ready";
		recipe: RecipeEditorValue;
		error: null;
	}
	| {
		kind: Exclude<EditStateKind, "ready">;
		recipe: null;
		error: unknown | null;
	};

const parseRecipeId = (value: string | null): number | null => {
	if (!/^[1-9]\d*$/.test(value || "")) return null;

	const recipeId = Number(value);
	return Number.isSafeInteger(recipeId) ? recipeId : null;
};

const getErrorKind = (error: unknown): Exclude<EditStateKind, "loading" | "invalid" | "ready"> => {
	if (error instanceof Error && "code" in error && error.code === OWNED_RECIPE_NOT_FOUND) return "not-found";
	if (isAxiosError(error) && error.response?.status === 403) return "forbidden";
	return "error";
};

const getErrorMessage = (error: unknown): string => {
	if (isAxiosError(error) && typeof error.response?.data?.message === "string") return error.response.data.message;
	return "Please try again.";
};

const EditRecipe = (): ReactElement => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const recipeId = useMemo(() => parseRecipeId(searchParams.get("id")), [searchParams]);
	const [state, setState] = useState<EditState>({ kind: recipeId ? "loading" : "invalid", recipe: null, error: null });
	const [restoreError, setRestoreError] = useState("");
	const { showToast } = useToast();

	const loadRecipe = useCallback(async () => {
		if (!recipeId) {
			setState({ kind: "invalid", recipe: null, error: null });
			return;
		}

		setState({ kind: "loading", recipe: null, error: null });
		try {
			const recipe = await loadOwnedRecipe(recipeId);
			setState({ kind: "ready", recipe, error: null });
		} catch (error: unknown) {
			setState({ kind: getErrorKind(error), recipe: null, error });
		}
	}, [recipeId]);

	useEffect(() => {
		loadRecipe();
	}, [loadRecipe]);

	const returnToProfile = () => navigate("/profile");
	const restoreRecipe = async () => {
		if (!recipeId) return;
		try {
			setRestoreError("");
			await axios.post(apiRoutes.recipeRestore(recipeId));
			await loadRecipe();
			showToast({ title: "Recipe restored" });
		} catch (error: unknown) {
			setRestoreError(isAxiosError(error) && typeof error.response?.data?.message === "string" ? error.response.data.message : "This recipe could not be restored. Please try again.");
			showToast({ title: "Couldn’t restore this recipe", message: "Please try again.", type: "error" });
		}
	};

	let content;
	if (state.kind === "loading") {
		content = <PageState title="Loading your recipe" message="Checking your cookbook for this recipe." />;
	} else if (state.kind === "invalid" || state.kind === "not-found") {
		content = <PageState type="error" title="Recipe not found" message="This recipe is no longer available in your cookbook." actionLabel="Back to profile" onAction={returnToProfile} />;
	} else if (state.kind === "forbidden") {
		content = <PageState type="error" title="You cannot edit this recipe" message="Your account does not have permission to edit this recipe." actionLabel="Back to profile" onAction={returnToProfile} />;
	} else if (state.kind === "error") {
		content = <PageState type="error" title="Recipe could not load" message={getErrorMessage(state.error)} actionLabel="Try again" onAction={loadRecipe} />;
	} else if (state.kind === "ready" && state.recipe.status === "archived") {
		content = <PageState type="empty" title="Restore this recipe before editing" message={restoreError || "Archived recipes are read-only. Restore this recipe to a draft, then continue editing."} actionLabel="Restore recipe" onAction={restoreRecipe} />;
	} else if (state.kind === "ready") {
		const readyRecipe = state.recipe;
		content = <RecipeEditor mode="edit" recipeId={recipeId} initialRecipe={readyRecipe} onSaved={({ recipe }) => navigate((recipe.status || readyRecipe.status) === "draft" ? "/profile" : `/recipe?id=${recipe.recipe_id}`)} />;
	}

	return (
		<main>
			<PageHelmet title="Edit Recipe" description="Edit a recipe from your cookbook." path="/food/edit" noIndex />
			{content}
		</main>
	);
};

export default EditRecipe;
