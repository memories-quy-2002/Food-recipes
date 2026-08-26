import React from "react";
import { CalendarDays, ChefHat, Clock3, Heart, Users } from "lucide-react";
import { Link } from "react-router-dom";
import convertImage from "@/shared/utils/convertImage";
import formatTimestamp from "@/shared/utils/formatTimestamp";
import ratingStar from "@/shared/utils/ratingStar";
import Button from "@/shared/ui/Button";
import { formatRecipeMinutes } from "@/shared/ui/RecipeCard";
import PrintRecipeButton from "@/features/recipes/share/PrintRecipeButton";
import ShareRecipeButton from "@/features/recipes/share/ShareRecipeButton";

const getTotalMinutes = (recipe) => {
	if (recipe?.total_time_minutes !== undefined && recipe?.total_time_minutes !== null) return recipe.total_time_minutes;
	const prep = Number(recipe?.prep_time_minutes || 0);
	const cook = Number(recipe?.cook_time_minutes || 0);
	return prep + cook || null;
};

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
	const tags = [...new Set([recipe.category_name, recipe.meal_name].filter(Boolean))];
	const difficulty = recipe.difficulty ?? recipe.difficulty_level ?? "Everyday";
	const servings = recipe.servings ?? recipe.nutrition?.servings ?? "—";
	const score = Number(recipe.overall_score || 0);
	const ratingCount = Number(recipe.num_ratings || 0);
	const metrics = [
		[<Clock3 className="size-4" aria-hidden="true" />, "Cooking time", formatRecipeMinutes(getTotalMinutes(recipe))],
		[<Users className="size-4" aria-hidden="true" />, "Servings", servings],
		[<ChefHat className="size-4" aria-hidden="true" />, "Difficulty", difficulty],
		[<CalendarDays className="size-4" aria-hidden="true" />, "Added", formatTimestamp(recipe.date_added)],
	];

	return (
		<section className="mx-auto grid w-full max-w-[100rem] gap-4 px-4 py-5 sm:gap-6 sm:px-6 sm:py-7 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:grid-rows-[48rem] lg:px-8 lg:py-10" aria-labelledby="recipe-title">
			<div className="order-first min-h-0 min-w-0 overflow-hidden rounded-xl bg-card shadow-lg shadow-foreground/10 lg:order-last lg:h-full">
				{convertImage(recipe.recipe_name, "block aspect-[4/3] h-full min-h-[18rem] w-full object-cover object-center sm:min-h-[26rem] lg:aspect-auto lg:min-h-0", recipe.image_url)}
			</div>

			<div className="flex min-h-0 min-w-0 flex-col justify-center rounded-xl bg-foreground p-5 text-background shadow-lg shadow-foreground/15 sm:p-8 lg:h-full lg:min-h-0 lg:p-10 xl:p-10">
				<p className="text-xs font-black uppercase tracking-[0.16em] text-secondary">Recipe detail</p>
				<h1 id="recipe-title" className="mt-3 max-w-[15ch] text-balance text-3xl font-black leading-[1] tracking-[-0.04em] sm:text-4xl lg:text-5xl">{recipe.recipe_name}</h1>
				<p className="mt-4 text-sm font-bold text-muted">By {recipe.full_name ?? "Food recipe"}</p>

				<div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2" aria-label={`Rated ${score.toFixed(1)} out of 5 from ${ratingCount} ${ratingCount === 1 ? "review" : "reviews"}`}>
					<strong className="text-3xl font-black text-background">{score.toFixed(1)}</strong>
					<span className="flex items-center gap-1 text-primary" aria-hidden="true">{ratingStar(score, "currentColor")}</span>
					<span className="text-sm font-bold text-muted">{ratingCount} {ratingCount === 1 ? "review" : "reviews"}</span>
				</div>

				{tags.length ? <div className="mt-5 flex flex-wrap gap-2" aria-label="Recipe category and meal type">{tags.map((tag) => <span key={tag} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-black text-secondary-foreground">{tag}</span>)}</div> : null}

				<dl className="mt-7 grid grid-cols-2 gap-2 border-y border-muted/30 py-4 sm:grid-cols-4 sm:gap-3">
					{metrics.map(([icon, label, value]) => <div key={label} className="min-w-0"><dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-muted">{icon}{label}</dt><dd className="mt-1 truncate text-sm font-black text-background">{value}</dd></div>)}
				</dl>

				<div className="mt-7 grid gap-2.5 sm:grid-cols-2">
					<Button asChild size="lg" className="h-auto min-h-12 rounded-lg bg-primary px-5 py-3 font-black text-primary-foreground shadow-md hover:bg-primary/90 sm:col-span-2"><Link to={`/recipe/cooking?id=${recipe.recipe_id}`}>Start cooking</Link></Button>
					<Button type="button" size="lg" variant="outline" className="h-auto min-h-12 rounded-lg border-secondary bg-secondary px-5 py-3 font-black text-secondary-foreground hover:bg-secondary/90" onClick={onClickFavorite} aria-label={favorite ? "Remove recipe from saved" : "Save recipe"} aria-pressed={favorite}><span aria-hidden="true"><Heart className="size-4" fill={favorite ? "currentColor" : "none"} /></span>{favorite ? "Saved" : "Save"}</Button>
					{onAddToPlan ? <Button type="button" size="lg" variant="outline" className="h-auto min-h-12 rounded-lg border-muted/60 bg-transparent px-4 py-3 font-black text-background hover:bg-muted/20 hover:text-background" onClick={onAddToPlan} disabled={isAddingToPlan} aria-busy={isAddingToPlan} aria-label={isAddingToPlan ? "Adding recipe to meal plan" : "Add recipe to meal plan"}>{isAddingToPlan ? "Adding…" : "Add to meal plan"}</Button> : null}
				</div>

				<div className="mt-3 flex flex-wrap gap-2" aria-label="Secondary recipe actions">
					{onSaveToCollection ? <Button type="button" size="sm" variant="outline" className="border-muted/60 bg-transparent text-background hover:bg-muted/20 hover:text-background" onClick={onSaveToCollection} aria-label="Save recipe to collection">Save to collection</Button> : null}
					{onAddIngredients ? <Button type="button" size="sm" variant="outline" className="border-muted/60 bg-transparent text-background hover:bg-muted/20 hover:text-background" onClick={onAddIngredients} disabled={isAddingIngredients} aria-busy={isAddingIngredients} aria-label={isAddingIngredients ? "Adding ingredients to shopping list" : "Add ingredients to shopping list"}>{isAddingIngredients ? "Adding ingredients…" : "Add ingredients to shopping list"}</Button> : null}
					<ShareRecipeButton recipeId={recipe.recipe_id} recipeName={recipe.recipe_name} description={recipe.recipe_description || ""} className="border-muted/60 bg-transparent text-background hover:bg-muted/20 hover:text-background" />
					<PrintRecipeButton className="border-muted/60 bg-transparent text-background hover:bg-muted/20 hover:text-background" />
				</div>
			</div>
		</section>
	);
};

export default RecipeContainerSummary;
