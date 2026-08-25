import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Clock3 } from "lucide-react";
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
		<section aria-labelledby="recently-viewed-title">
			<div className="mb-5 flex items-end gap-3">
				<div className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
					<Clock3 className="size-5" aria-hidden="true" />
				</div>
				<div>
					<p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Pick up where you left off</p>
					<h2 id="recently-viewed-title" className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Recently viewed</h2>
				</div>
			</div>
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
				{viewedRecipes.map((recipe) => (
					<Link
						key={recipe.recipe_id}
						to={`/recipe?id=${recipe.recipe_id}`}
						className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<div className="aspect-[4/3] overflow-hidden bg-muted">
							{convertImage(recipe.recipe_name, "size-full object-cover transition duration-300 group-hover:scale-[1.03]", recipe.image_url)}
						</div>
						<span className="block line-clamp-2 min-h-[3.75rem] px-4 py-3 text-sm font-black leading-5 text-foreground">{recipe.recipe_name}</span>
					</Link>
				))}
			</div>
		</section>
	);
};

export default RecentlyViewedRecipes;
