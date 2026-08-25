import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import FoodCard from "./FoodCard";
import Button from "@/shared/ui/Button";

const featuredModes = [
	{ id: "top-rated", label: "Top rated" },
	{ id: "most-reviewed", label: "Most reviewed" },
	{ id: "quick-meals", label: "Quick meals" },
];

export const featuredModeMeta = {
	"top-rated": { eyebrow: "Community favorites", title: "Top rated recipes" },
	"most-reviewed": { eyebrow: "Popular with cooks", title: "Most reviewed recipes" },
	"quick-meals": { eyebrow: "Short on time", title: "Quick meals" },
};

export const isRecipeFavorite = (recipe, wishlist) =>
	wishlist.some(
		(item) => Number(item.recipe?.recipe_id ?? item.recipe_id) === Number(recipe.recipe_id)
	);

const FoodCardList = ({ recipes, wishlist, onClickFavorite, featuredMode, onFeaturedModeChange }) => {
	const activeModeMeta = featuredModeMeta[featuredMode] ?? featuredModeMeta["top-rated"];

	return (
		<section aria-labelledby="featured-recipes-heading">
			<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">{activeModeMeta.eyebrow}</p>
					<h2 id="featured-recipes-heading" className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{activeModeMeta.title}</h2>
				</div>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					<div className="flex w-full gap-1 overflow-x-auto rounded-xl border border-border bg-muted/60 p-1 sm:w-auto" role="tablist" aria-label="Featured recipe ranking">
						{featuredModes.map((mode) => (
							<Button
								key={mode.id}
								type="button"
								role="tab"
								aria-selected={featuredMode === mode.id}
								variant={featuredMode === mode.id ? "default" : "ghost"}
								size="sm"
								className="min-h-11 shrink-0 rounded-lg px-3 font-bold"
								onClick={() => onFeaturedModeChange(mode.id)}
							>
								{mode.label}
							</Button>
						))}
					</div>
					<Link className="inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-bold text-primary underline-offset-4 hover:underline" to="/food">
						Explore all recipes <ArrowRight className="size-4" aria-hidden="true" />
					</Link>
				</div>
			</div>

			{recipes.length > 0 ? (
				<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:gap-5">
					{recipes.map(({ recipe_id, recipe_name, category_name, meal_name, num_ratings, overall_score, image_url, total_time_minutes, dietary_tags }) => (
						<FoodCard
							key={recipe_id}
							id={recipe_id}
							name={recipe_name}
							category={category_name}
							meal={meal_name}
							ratings={num_ratings}
							score={overall_score}
							imageUrl={image_url}
							totalTimeMinutes={total_time_minutes}
							dietaryTags={dietary_tags}
							favorite={isRecipeFavorite({ recipe_id }, wishlist)}
							onClickFavorite={() => onClickFavorite(recipe_id)}
						/>
					))}
				</div>
			) : (
				<div className="rounded-2xl border border-dashed border-border bg-muted/40 px-5 py-12 text-center text-sm text-muted-foreground">
					No recipes match this filter yet. Try another category or ranking.
				</div>
			)}
		</section>
	);
};

export default FoodCardList;
