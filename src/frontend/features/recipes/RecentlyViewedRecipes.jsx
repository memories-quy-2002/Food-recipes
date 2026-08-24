import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import convertImage from "@/shared/utils/convertImage";
import { getRecentlyViewedRecipeIds } from "./recentlyViewed";

const RecentlyViewedRecipes = ({ recipes = [] }) => {
	const viewedRecipes = useMemo(() => {
		if (typeof window === "undefined") return [];
		const ids = getRecentlyViewedRecipeIds(window.localStorage);
		return ids
			.map((recipeId) => recipes.find((recipe) => Number(recipe.recipe_id) === recipeId))
			.filter(Boolean)
			.slice(0, 6);
	}, [recipes]);

	if (viewedRecipes.length === 0) return null;

	return (
		<section className="home__main__recently-viewed" aria-labelledby="recently-viewed-title">
			<div className="home__sectionHeader">
				<div>
					<span>Pick up where you left off</span>
					<h2 id="recently-viewed-title">Recently viewed</h2>
				</div>
			</div>
			<div className="home__main__recently-viewed__list">
				{viewedRecipes.map((recipe) => (
					<Link key={recipe.recipe_id} to={`/recipe?id=${recipe.recipe_id}`}>
						{convertImage(recipe.recipe_name, "home__main__recently-viewed__image", recipe.image_url)}
						<span>{recipe.recipe_name}</span>
					</Link>
				))}
			</div>
		</section>
	);
};

export default RecentlyViewedRecipes;
