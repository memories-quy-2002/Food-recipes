import React from "react";
import { useNavigate } from "react-router-dom";
import PageHelmet from "@/shared/seo/PageHelmet";
import RecipeEditor from "./RecipeEditor";

export { validateRecipeForm } from "./RecipeEditor";

const AddRecipe = () => {
	const navigate = useNavigate();

	return (
		<main>
			<PageHelmet
				title="Add Recipe"
				description="Create and share a new recipe with ingredients, cooking steps, images, and preparation time."
				path="/food/add"
				noIndex
			/>
			<RecipeEditor
				mode="create"
				recipeId={null}
				initialRecipe={null}
				onSaved={({ recipe, mode }) => navigate(mode === "create" ? "/food" : `/recipe?id=${recipe.recipe_id}`)}
			/>
		</main>
	);
};

export default AddRecipe;
