import type { ReactElement } from "react";
import { ArrowRight, CalendarDays, ChefHat, Clock3, Heart, Sparkles, Utensils, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import type { HomeFeedSection, HomeFeedSectionKey, RecipeSummary } from "@/shared/api/contracts";
import { useHomeFeedQuery } from "./api/useHomeFeedQuery";
import type { WishlistItem } from "./main/FoodCardList";
import RecipeCard from "@/shared/ui/RecipeCard";
import KitchenCommandCenter from "./KitchenCommandCenter";

const HOME_FEED_SECTION_LIMIT = 3;
const HOME_FEED_RECIPE_LIMIT = 4;

const sectionIcons: Record<HomeFeedSectionKey, LucideIcon> = {
	continue: CalendarDays,
	pantry: Utensils,
	recommended: Sparkles,
	saved: Heart,
	quick: Clock3,
	popular: ChefHat,
};

type HomeFeedSectionProps = {
	section: HomeFeedSection;
	wishlist: WishlistItem[];
	onClickFavorite: (recipeId: number) => void | Promise<void>;
};

const HomeFeedSection = ({
	section,
	wishlist,
	onClickFavorite,
}: HomeFeedSectionProps): ReactElement => {
	const Icon = sectionIcons[section.key] ?? Sparkles;

	return (
		<section aria-labelledby={`home-feed-${section.key}-title`}>
			<div className="mb-5 flex items-start gap-3">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
					<Icon className="size-5" aria-hidden="true" />
				</div>
				<div>
					<p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">{section.key === "recommended" ? "Picked for you" : "Your kitchen"}</p>
					<h2 id={`home-feed-${section.key}-title`} className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{section.title}</h2>
					<p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{section.description}</p>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:gap-5">
				{section.recipes.map((recipe: RecipeSummary) => (
					<RecipeCard
						key={recipe.recipe_id}
						recipe={recipe}
						favorite={wishlist.some((item) => Number(item.recipe?.recipe_id ?? item.recipe_id) === Number(recipe.recipe_id))}
						onToggleFavorite={() => onClickFavorite(recipe.recipe_id)}
					/>
				))}
			</div>
		</section>
	);
};

export type PersonalizedHomeFeedProps = {
	isAuthenticated: boolean;
	userId?: number | string;
	wishlist: WishlistItem[];
	onClickFavorite: (recipeId: number) => void | Promise<void>;
};

const PersonalizedHomeFeed = ({
	isAuthenticated,
	userId,
	wishlist,
	onClickFavorite,
}: PersonalizedHomeFeedProps): ReactElement => {
	const { data, isLoading, isError, refetch } = useHomeFeedQuery(isAuthenticated);
	const sections = (data?.sections ?? [])
		.filter((section) => section.recipes?.length > 0)
		.slice(0, HOME_FEED_SECTION_LIMIT)
		.map((section) => ({
			...section,
			recipes: section.recipes.slice(0, HOME_FEED_RECIPE_LIMIT),
		}));

	if (isLoading) {
		return (
			<section aria-busy="true" aria-labelledby="home-feed-loading-title" className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
				<p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">{isAuthenticated ? "Personalizing your kitchen" : "Fresh from the kitchen"}</p>
				<h2 id="home-feed-loading-title" className="mt-2 text-2xl font-black tracking-tight">Finding a few good ideas</h2>
				<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
					{[1, 2, 3, 4].map((item) => <div key={item} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />)}
				</div>
			</section>
		);
	}

	if (isError) {
		return (
			<section role="alert" className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6 sm:p-8">
				<p className="text-xs font-extrabold uppercase tracking-[0.16em] text-destructive">Home feed unavailable</p>
				<h2 className="mt-2 text-2xl font-black tracking-tight">We could not load your recipe ideas.</h2>
				<p className="mt-2 text-sm text-muted-foreground">Your saved recipes and the full recipe explorer are still available.</p>
				<button type="button" className="mt-5 inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-bold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => void refetch()}>Try again</button>
			</section>
		);
	}

	return (
		<section aria-labelledby="home-feed-title" className="space-y-8">
			{isAuthenticated && data?.kitchen ? <KitchenCommandCenter kitchen={data.kitchen} userId={userId} /> : null}
			<div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
				<div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">{isAuthenticated ? "Personalized for you" : "A fresh start"}</p>
						<h2 id="home-feed-title" className="mt-2 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">{isAuthenticated ? "Recipes that fit your kitchen" : "Find something delicious for today"}</h2>
						<p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{isAuthenticated ? "Your feed blends what you saved, what you rated, what is in your pantry, and what you planned next." : "Start with a quick idea or see what the community is cooking."}</p>
					</div>
					<Link to={isAuthenticated ? "/pantry" : "/food"} className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
						{isAuthenticated ? "Update your pantry" : "Explore all recipes"} <ArrowRight className="size-4" aria-hidden="true" />
					</Link>
				</div>
			</div>
			{sections.map((section) => <HomeFeedSection key={section.key} section={section} wishlist={wishlist} onClickFavorite={onClickFavorite} />)}
		</section>
	);
};

export default PersonalizedHomeFeed;
