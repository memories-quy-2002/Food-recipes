import React, { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { RecipeContext } from "@/app/RecipeProvider";
import convertImage from "@/shared/utils/convertImage";
import ratingStar from "@/shared/utils/ratingStar";

type RecipeOtherListProps = {
	recipeId: number | string;
};

const RecipeOtherList = ({ recipeId }: RecipeOtherListProps): React.ReactElement | null => {
	const { recipes } = useContext(RecipeContext);
	const relatedRecipes = useMemo(() => {
		const candidates = recipes.filter(
			(recipe) => Number(recipe.recipe_id) !== Number(recipeId)
		);
		return candidates.slice(0, 5);
	}, [recipeId, recipes]);

	if (!relatedRecipes.length) return null;

	return (
		<section className="mx-auto w-full max-w-[100rem] px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20 2xl:max-w-[108rem]" aria-labelledby="related-recipes-heading">
			<div className="mb-5 flex items-end justify-between gap-4">
				<div>
					<h2 id="related-recipes-heading" className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">More recipes</h2>
				</div>
				<Link to="/food" className="hidden min-h-11 items-center gap-2 text-sm font-bold text-primary underline-offset-4 hover:underline sm:inline-flex">
					Browse all <ArrowRight className="size-4" aria-hidden="true" />
				</Link>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
				{relatedRecipes.map((recipe) => (
					<Link
						key={recipe.recipe_id}
						to={`/recipe?id=${recipe.recipe_id}`}
						className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<div className="aspect-[4/3] overflow-hidden bg-muted">
							{convertImage(recipe.recipe_name, "size-full object-cover transition duration-300 group-hover:scale-[1.03]", recipe.image_url)}
						</div>
						<div className="p-4">
							<h3 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-foreground">{recipe.recipe_name}</h3>
							<div className="mt-3 flex items-center gap-2" aria-label={`Rated ${Number(recipe.overall_score || 0).toFixed(1)} out of 5 from ${Number(recipe.num_ratings || 0)} ratings`}>
								<div className="flex items-center gap-0.5 text-primary" aria-hidden="true">{ratingStar(recipe.overall_score, "currentColor")}</div>
								<span className="text-xs font-semibold text-muted-foreground">{Number(recipe.num_ratings || 0)} ratings</span>
							</div>
						</div>
					</Link>
				))}
			</div>
		</section>
	);
};

export default RecipeOtherList;
