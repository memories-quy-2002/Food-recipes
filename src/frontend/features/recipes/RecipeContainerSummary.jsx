import React from "react";
import { Link } from "react-router-dom";
import { BsHeart, BsHeartFill } from "react-icons/bs";
import convertImage from "@/shared/utils/convertImage";
import formatTimestamp from "@/shared/utils/formatTimestamp";
import ratingStar from "@/shared/utils/ratingStar";
import Button from "@/shared/ui/Button";

const RecipeContainerSummary = ({
	recipe,
	favorite,
	onClickFavorite,
	onAddToPlan,
	isAddingToPlan = false,
	onSaveToCollection,
	onAddIngredients,
	isAddingIngredients = false,
}) => {
	const tags = [
		recipe.category_name,
		recipe.meal_name,
		recipe.difficulty ?? recipe.difficulty_level,
	].filter(Boolean);

	return (
		<section className="mx-auto grid w-full max-w-[100rem] gap-3 px-3 py-3 sm:gap-5 sm:px-5 sm:py-5 lg:grid-cols-2 lg:px-8 lg:py-8 2xl:max-w-[108rem]">
			<div className="flex min-w-0 flex-col justify-center rounded-[1.75rem] bg-[linear-gradient(135deg,#18110c_0%,#4b2e1e_100%)] p-5 text-[#fff8ef] shadow-xl shadow-stone-950/10 sm:p-8 lg:min-h-[34rem] lg:p-10 xl:p-12">
				<div>
					<p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffd18b]">Recipe detail</p>
					<h1 className="mt-3 max-w-[12ch] text-balance text-4xl font-black leading-[0.95] tracking-[-0.05em] sm:text-5xl lg:text-6xl xl:text-7xl">
						{recipe.recipe_name}
					</h1>
				</div>

				<div
					className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2"
					aria-label={`Rated ${recipe.overall_score ?? 0} out of 5 from ${recipe.num_ratings ?? 0} ratings`}
				>
					<strong className="text-3xl font-black">
						{Number(recipe.overall_score || 0).toFixed(1)}
					</strong>
					<div className="flex items-center gap-1" aria-hidden="true">
						{ratingStar(recipe.overall_score, "#ff9f1c").map((star) => star)}
					</div>
					<span className="text-sm font-bold text-[#fff8ef]/70">
						{recipe.num_ratings ?? 0} ratings
					</span>
				</div>

				<p className="mt-5 text-sm font-black uppercase tracking-[0.08em] text-[#ffd18b]">
					By {recipe.full_name ?? "Food recipe"}
				</p>

				{tags.length > 0 && (
					<div className="mt-4 flex flex-wrap gap-2" aria-label="Recipe details">
						{tags.map((tag) => (
							<span key={tag} className="rounded-full border border-[#ffd18b]/35 bg-white/5 px-3 py-1.5 text-xs font-black text-[#fff8ef]">
								{tag}
							</span>
						))}
					</div>
				)}

				<p className="mt-3 text-sm text-[#fff8ef]/60">{formatTimestamp(recipe.date_added)}</p>

				<div className="mt-7 grid gap-2.5 sm:grid-cols-2">
					<Button asChild size="lg" className="h-auto min-h-12 rounded-xl bg-primary px-5 py-3 font-black text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">
						<Link to={`/recipe/cooking?id=${recipe.recipe_id}`}>Start cooking</Link>
					</Button>

					<Button type="button" size="lg" variant="outline" className="h-auto min-h-12 rounded-xl border-white/30 bg-transparent px-5 py-3 font-black text-[#fff8ef] hover:border-white/50 hover:bg-white/10 hover:text-[#fff8ef]" onClick={onClickFavorite} aria-label={favorite ? "Remove from favorite" : "Add to favorite"}>
						{favorite ? <BsHeartFill aria-hidden="true" /> : <BsHeart aria-hidden="true" />}
						<span>{favorite ? "Remove favorite" : "Add favorite"}</span>
					</Button>

					{onAddToPlan && (
						<Button type="button" size="lg" className="h-auto min-h-12 rounded-xl bg-[#ffd18b] px-5 py-3 font-black text-[#211813] hover:bg-[#ffe1b2]" onClick={onAddToPlan} disabled={isAddingToPlan} aria-busy={isAddingToPlan}>
							{isAddingToPlan ? "Adding to plan..." : "Add to plan"}
						</Button>
					)}

					{onSaveToCollection && (
						<Button type="button" size="lg" variant="secondary" className="h-auto min-h-12 rounded-xl px-5 py-3 font-black" onClick={onSaveToCollection}>
							Save to collection
						</Button>
					)}

					{onAddIngredients && (
						<Button type="button" size="lg" variant="secondary" className="h-auto min-h-12 rounded-xl px-5 py-3 font-black sm:col-span-2" onClick={onAddIngredients} disabled={isAddingIngredients} aria-busy={isAddingIngredients}>
							{isAddingIngredients ? "Adding ingredients..." : "Add ingredients to shopping list"}
						</Button>
					)}
				</div>
			</div>

			<div className="min-w-0 overflow-hidden rounded-[1.75rem] bg-muted shadow-xl shadow-stone-950/10 lg:min-h-[34rem]">
				{convertImage(
					recipe.recipe_name,
					"block aspect-[4/3] h-full min-h-[18rem] w-full object-cover object-center sm:min-h-[24rem] lg:aspect-auto lg:min-h-[34rem]",
					recipe.image_url
				)}
			</div>
		</section>
	);
};

export default RecipeContainerSummary;
