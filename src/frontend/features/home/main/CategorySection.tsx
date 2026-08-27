import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LayoutGrid } from "lucide-react";
import convertImage from "@/shared/utils/convertImage";
import { cn } from "@/shared/lib/utils";
import type { CatalogItem } from "@/shared/api/contracts";

export type HomeCategory = CatalogItem & {
	recipe_count?: number | string | null;
	recipeCount?: number | string | null;
	category_name?: string | null;
};

export const curatedCategoryOrder = [
	"chicken", "pasta dishes", "pizza", "soups", "salads", "desserts", "beef",
	"seafood", "sandwiches", "appetizers", "baking", "breads", "egg", "sweet", "main",
];

const categoryPopularity = (category: HomeCategory): number | null => {
	const value = category?.recipe_count ?? category?.recipeCount;
	const popularity = Number(value);
	return Number.isFinite(popularity) && popularity >= 0 ? popularity : null;
};

const categoryName = (category: HomeCategory): string =>
	String(category.name ?? category.category_name ?? "");

export const rankCategories = (categories: HomeCategory[] = []): HomeCategory[] =>
	[...categories].sort((left, right) => {
		const leftPopularity = categoryPopularity(left);
		const rightPopularity = categoryPopularity(right);
		if (leftPopularity !== null && rightPopularity !== null) {
			const difference = rightPopularity - leftPopularity;
			if (difference !== 0) return difference;
		} else if (leftPopularity !== null || rightPopularity !== null) {
			return leftPopularity === null ? 1 : -1;
		}
		const leftPriority = curatedCategoryOrder.indexOf(categoryName(left).toLowerCase());
		const rightPriority = curatedCategoryOrder.indexOf(categoryName(right).toLowerCase());
		const normalizedLeft = leftPriority === -1 ? Number.MAX_SAFE_INTEGER : leftPriority;
		const normalizedRight = rightPriority === -1 ? Number.MAX_SAFE_INTEGER : rightPriority;
		if (normalizedLeft !== normalizedRight) return normalizedLeft - normalizedRight;
		return categoryName(left).localeCompare(categoryName(right), "en", { sensitivity: "base" });
	});

export type CategorySectionProps = {
	categories: HomeCategory[];
	selectedCategoryId: string | number;
	onCategorySelect: (categoryId: string | number) => void;
};

const CategorySection = ({
	categories,
	selectedCategoryId,
	onCategorySelect,
}: CategorySectionProps): React.ReactElement => {
	const rankedCategories = rankCategories(categories).slice(0, 5);
	const baseCard = "group relative min-h-36 overflow-hidden rounded-2xl border text-left shadow-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:-translate-y-0.5 hover:shadow-md";

	return (
		<section aria-labelledby="home-categories-heading">
			<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="sr-only">Cook by mood</p>
					<h2 id="home-categories-heading" className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Browse categories</h2>
				</div>
				<Link className="inline-flex min-h-11 items-center gap-2 self-start rounded-full px-1 text-sm font-bold text-primary underline-offset-4 hover:underline sm:self-auto" to="/food">
					Browse all <ArrowRight className="size-4" aria-hidden="true" />
				</Link>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
				<button
					type="button"
					className={cn(baseCard, "flex flex-col justify-between bg-foreground p-5 text-background", selectedCategoryId === "all" && "ring-2 ring-primary ring-offset-2")}
					onClick={() => onCategorySelect("all")}
					aria-pressed={selectedCategoryId === "all"}
				>
					<div className="flex size-10 items-center justify-center rounded-full bg-background/10"><LayoutGrid className="size-5" aria-hidden="true" /></div>
					<div className="mt-5">
						<h3 className="font-black">All categories</h3>
						<p className="sr-only">See every featured recipe.</p>
					</div>
				</button>

				{rankedCategories.map(({ id: categoryId, name }) => {
					const active = Number(selectedCategoryId) === Number(categoryId);
					return (
						<button
							key={categoryId}
							type="button"
							className={cn(baseCard, "bg-card", active && "ring-2 ring-primary ring-offset-2")}
							onClick={() => onCategorySelect(categoryId)}
							aria-pressed={active}
						>
							{convertImage(name, "absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-[1.03]")}
							<span className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/25 to-transparent" aria-hidden="true" />
							<span className="absolute inset-x-0 bottom-0 p-4 text-background">
								<strong className="block text-base font-black">{name}</strong>
								<span className="sr-only">Filter featured recipes</span>
							</span>
						</button>
					);
				})}
			</div>
		</section>
	);
};

export default CategorySection;
