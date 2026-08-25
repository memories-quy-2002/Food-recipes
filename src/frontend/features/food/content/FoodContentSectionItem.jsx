import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import convertImage from "@/shared/utils/convertImage";
import ratingStar from "@/shared/utils/ratingStar";

const FoodContentSectionItem = ({ recipe, viewMode = "grid" }) => {
	const { recipe_id, recipe_name, overall_score, num_ratings, category_name, meal_name } = recipe;
	return <article className="group min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"><Link className={cn("block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset", viewMode === "list" && "grid sm:grid-cols-[220px_minmax(0,1fr)]")} to={`/recipe?id=${recipe_id}`} aria-label={`Open ${recipe_name}`}><div className={cn("overflow-hidden bg-muted", viewMode === "grid" ? "aspect-[4/3]" : "aspect-[16/9] sm:aspect-auto sm:min-h-44")}>{convertImage(recipe_name, "h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]", recipe.image_url)}</div><div className="flex min-w-0 flex-col p-4 sm:p-5"><div className="mb-3 flex flex-wrap gap-2">{category_name && <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">{category_name}</span>}{meal_name && <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{meal_name}</span>}</div><h3 className="line-clamp-2 text-lg font-black leading-snug text-foreground group-hover:text-primary">{recipe_name}</h3><div className="mt-auto pt-4"><div className="flex flex-wrap items-center gap-2"><div className="flex gap-0.5" aria-hidden="true">{ratingStar(overall_score, "orange")}</div><span className="text-sm font-semibold text-muted-foreground">{Number(overall_score || 0).toFixed(1)} · {num_ratings} ratings</span></div></div></div></Link></article>;
};
export default FoodContentSectionItem;
