import React from "react";
import { Clock3, Heart, HeartOff, Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { RecipeSummary } from "@/shared/api/contracts";
import convertImage from "@/shared/utils/convertImage";
import { cn } from "@/shared/lib/utils";

export const formatRecipeMinutes = (
	value: number | string | null | undefined,
): string => {
	const minutes = Number(value);
	if (!Number.isFinite(minutes) || minutes < 1) return "Time n/a";
	if (minutes < 60) return `${Math.round(minutes)} min`;
	const hours = Math.floor(minutes / 60);
	const remainder = Math.round(minutes % 60);
	return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
};

type RecipeCardRecipe = RecipeSummary & {
	dietaryTags?: string[];
};

export type RecipeCardProps = {
	recipe: RecipeCardRecipe;
	viewMode?: "grid" | "list";
	favorite?: boolean;
	onToggleFavorite?: () => void;
};

type RecipeMetadataItem = {
	icon: React.ReactElement | null;
	label: string;
};

const RecipeCard = ({
	recipe,
	viewMode = "grid",
	favorite,
	onToggleFavorite,
}: RecipeCardProps): React.ReactElement => {
	const name = recipe.recipe_name || "Untitled recipe";
	const dietaryTag = (recipe.dietary_tags || recipe.dietaryTags || []).find(
		Boolean,
	);
	const totalMinutes = Number(recipe.total_time_minutes);
	const metadata = [
		Number.isFinite(totalMinutes) && totalMinutes > 0
			? {
					icon: <Clock3 className="size-3.5" aria-hidden="true" />,
					label: formatRecipeMinutes(totalMinutes),
				}
			: null,
		recipe.meal_name ? { icon: null, label: recipe.meal_name } : null,
		dietaryTag ? { icon: null, label: dietaryTag } : null,
	].filter((item): item is RecipeMetadataItem => item !== null);
	const score = Number(recipe.overall_score || 0);
	const ratings = Number(recipe.num_ratings || 0);

	return (
		<article
			className={cn(
				"group relative min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/10 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
				viewMode === "list" && "sm:grid sm:grid-cols-[15rem_minmax(0,1fr)]",
			)}
		>
			<Link
				className={cn(
					"block h-full focus:outline-none",
					viewMode === "list" && "sm:grid sm:grid-cols-subgrid sm:col-span-2",
				)}
				to={`/recipe?id=${recipe.recipe_id}`}
				aria-label={`Open ${name}`}
			>
				<div
					className={cn(
						"overflow-hidden bg-muted",
						viewMode === "grid"
							? "aspect-[4/3]"
							: "aspect-[16/9] sm:aspect-auto sm:min-h-48",
					)}
				>
					{convertImage(
						name,
						"size-full object-cover transition duration-300 group-hover:scale-[1.03]",
						recipe.image_url,
					)}
				</div>
				<div className="flex min-w-0 flex-col p-4 sm:p-5">
					<div className="flex items-center justify-between gap-3">
						<span className="text-xs font-black uppercase tracking-[0.14em] text-primary">
							{recipe.category_name || "Recipe"}
						</span>
						{score > 0 ? (
							<span
								className="inline-flex items-center gap-1 text-xs font-black text-foreground"
								aria-label={`${score.toFixed(1)} out of 5 from ${ratings} ${ratings === 1 ? "rating" : "ratings"}`}
							>
								<Star
									className="size-3.5 fill-current text-primary"
									aria-hidden="true"
								/>
								{score.toFixed(1)}
								{ratings > 0 ? (
									<span className="font-semibold text-muted-foreground">
										({ratings})
									</span>
								) : null}
							</span>
						) : null}
					</div>
					<h3 className="mt-2 line-clamp-2 min-h-[3rem] text-lg font-black leading-6 tracking-tight text-foreground sm:text-xl">
						{name}
					</h3>
					{metadata.length ? (
						<div
							className="mt-4 flex min-h-8 flex-wrap items-center gap-1.5 border-y border-border py-2 text-xs font-bold text-muted-foreground"
							aria-label="Recipe metadata"
						>
							{metadata.map(({ icon, label }, index) => (
								<React.Fragment key={`${label}-${index}`}>
									{index > 0 ? (
										<span aria-hidden="true" className="text-border">
											·
										</span>
									) : null}
									<span className="inline-flex items-center gap-1">
										{icon}
										{label}
									</span>
								</React.Fragment>
							))}
						</div>
					) : null}
				</div>
			</Link>
			{onToggleFavorite ? (
				<button
					type="button"
					className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-sm backdrop-blur transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					onClick={(event) => {
						event.preventDefault();
						event.stopPropagation();
						onToggleFavorite();
					}}
					aria-label={
						favorite ? `Remove ${name} from saved recipes` : `Save ${name}`
					}
					aria-pressed={Boolean(favorite)}
				>
					{favorite ? (
						<HeartOff className="size-5" aria-hidden="true" />
					) : (
						<Heart className="size-5" aria-hidden="true" />
					)}
				</button>
			) : null}
		</article>
	);
};

export default RecipeCard;
