import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";
import convertImage from "@/shared/utils/convertImage";
import Button from "@/shared/ui/Button";

const QUICK_FILTER_LIMIT = 4;
const SEARCH_RESULTS_ID = "recipe-search-results";

const normalizeLabel = (value) =>
	typeof value === "string" ? value.trim() : "";

export const getQuickFilters = (recipes = []) => {
	const labels = new Map();

	recipes.forEach((recipe) => {
		[recipe?.category_name, recipe?.meal_name].forEach((value) => {
			const label = normalizeLabel(value);
			if (!label) return;
			const key = label.toLocaleLowerCase();
			const current = labels.get(key);
			labels.set(key, {
				label: current?.label || label,
				count: (current?.count || 0) + 1,
				order: current?.order ?? labels.size,
			});
		});
	});

	return [...labels.values()]
		.sort((a, b) => b.count - a.count || a.order - b.order)
		.slice(0, QUICK_FILTER_LIMIT)
		.map(({ label }) => label);
};

const HomeSearchBar = ({ recipes = [], searchResults, isSearchLoading = false, searchError = null }) => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const searchTerm = searchParams.get("q") || "";
	const quickFilters = getQuickFilters(recipes);
	const [activeIndex, setActiveIndex] = useState(-1);
	const [isResultListOpen, setIsResultListOpen] = useState(Boolean(searchTerm));

	const updateSearchTerm = (value) => {
		setSearchParams((currentParams) => {
			const nextParams = new URLSearchParams(currentParams);
			if (value.trim()) nextParams.set("q", value);
			else nextParams.delete("q");
			return nextParams;
		}, { replace: true });
	};

	const handleChange = (event) => {
		setActiveIndex(-1);
		setIsResultListOpen(Boolean(event.target.value.trim()));
		updateSearchTerm(event.target.value);
	};

	const handleQuickFilter = (label) => {
		setActiveIndex(-1);
		setIsResultListOpen(true);
		updateSearchTerm(label);
	};

	const filteredRecipes = Array.isArray(searchResults)
		? searchResults
		: recipes.filter((recipe) =>
			[recipe.recipe_name, recipe.category_name, recipe.meal_name].some((value) =>
				normalizeLabel(value).toLocaleLowerCase().includes(searchTerm.trim().toLocaleLowerCase())
			)
		);

	useEffect(() => {
		setActiveIndex(-1);
		setIsResultListOpen(Boolean(searchTerm.trim()));
	}, [searchTerm]);

	const handleKeyDown = (event) => {
		if (event.key === "Escape") {
			event.preventDefault();
			setActiveIndex(-1);
			setIsResultListOpen(false);
			return;
		}
		if (event.key === "ArrowDown" && filteredRecipes.length > 0) {
			event.preventDefault();
			setIsResultListOpen(true);
			setActiveIndex((currentIndex) => currentIndex < filteredRecipes.length - 1 ? currentIndex + 1 : 0);
			return;
		}
		if (event.key === "ArrowUp" && filteredRecipes.length > 0) {
			event.preventDefault();
			setIsResultListOpen(true);
			setActiveIndex((currentIndex) => currentIndex > 0 ? currentIndex - 1 : filteredRecipes.length - 1);
			return;
		}
		if (event.key === "Enter" && isResultListOpen && filteredRecipes[activeIndex]) {
			event.preventDefault();
			navigate(`/recipe?id=${filteredRecipes[activeIndex].recipe_id}`);
		}
	};

	const activeDescendant =
		isResultListOpen && activeIndex >= 0 ? `recipe-search-option-${activeIndex}` : undefined;

	return (
		<section className="relative w-full overflow-visible rounded-xl border border-border bg-card px-5 py-7 text-center shadow-md sm:px-8 sm:py-8 lg:px-10 lg:py-9">
			<div className="mx-auto flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
				<Sparkles className="size-5" aria-hidden="true" />
			</div>
			<p className="mt-4 text-xs font-extrabold uppercase tracking-[0.18em] text-primary sm:text-sm">
				Recipe index
			</p>
			<h1 className="mx-auto mt-3 max-w-3xl text-balance text-3xl font-black tracking-[-0.035em] text-foreground sm:text-4xl">
				Search the recipe index.
			</h1>
			<p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
				Search by recipe, category, or meal type. Pick an idea and get to cooking faster.
			</p>

			<div className="relative mx-auto mt-7 w-full max-w-2xl text-left">
				<Search className="pointer-events-none absolute left-4 top-[14px] z-10 size-5 text-muted-foreground" aria-hidden="true" />
				<input
					type="search"
					placeholder="Search recipes, cuisines, or meal types…"
					aria-label="Search recipes"
					role="combobox"
					aria-autocomplete="list"
					aria-controls={SEARCH_RESULTS_ID}
					aria-expanded={Boolean(searchTerm) && isResultListOpen}
					aria-activedescendant={activeDescendant}
					className="h-12 w-full rounded-full border border-input bg-background pl-12 pr-5 text-base text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
					value={searchTerm}
					onChange={handleChange}
					onFocus={() => searchTerm.trim() && setIsResultListOpen(true)}
					onKeyDown={handleKeyDown}
				/>

				{quickFilters.length > 0 ? (
					<div className="mt-3 flex flex-wrap justify-center gap-2" aria-label="Popular recipe filters">
						{quickFilters.map((label) => (
							<Button
								key={label}
								type="button"
								variant="outline"
								size="sm"
								className="min-h-11 rounded-full px-4 text-sm font-bold"
								onClick={() => handleQuickFilter(label)}
							>
								{label}
							</Button>
						))}
					</div>
				) : null}

				{searchTerm && isResultListOpen ? (
					<ul
						id={SEARCH_RESULTS_ID}
						role="listbox"
						aria-label="Recipe search results"
						aria-live="polite"
						className="absolute inset-x-0 top-[calc(100%+0.75rem)] z-30 max-h-80 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-foreground/10"
					>
						{isSearchLoading ? (
							<li key="search-loading" className="px-4 py-4 text-sm text-muted-foreground" role="option" aria-disabled="true">Searching recipes…</li>
						) : searchError ? (
							<li key="search-error" className="px-4 py-4 text-sm text-destructive" role="option" aria-disabled="true">Search suggestions are unavailable.</li>
						) : filteredRecipes.length > 0 ? (
							<React.Fragment key="recipe-search-options">
								{filteredRecipes.map((recipe, index) => (
									<li
										key={recipe.recipe_id}
										id={`recipe-search-option-${index}`}
										role="option"
										tabIndex={-1}
										aria-selected={index === activeIndex}
										className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-accent aria-selected:bg-accent"
										onMouseEnter={() => setActiveIndex(index)}
										onClick={() => navigate(`/recipe?id=${recipe.recipe_id}`)}
									>
										{convertImage(recipe.recipe_name, "size-12 shrink-0 rounded-xl object-cover sm:size-14", recipe.image_url)}
										<div className="min-w-0">
											<p className="truncate font-bold text-foreground">{recipe.recipe_name}</p>
											<p className="mt-0.5 truncate text-xs text-muted-foreground">{recipe.category_name || recipe.meal_name || "Recipe"}</p>
										</div>
									</li>
								))}
							</React.Fragment>
						) : (
							<li key="search-empty" className="px-4 py-4 text-sm text-muted-foreground" role="option" aria-disabled="true">No recipe found. Try a broader term.</li>
						)}
						<li className="mt-1 border-t border-border p-1 pt-2" key="view-all-results">
							<Link
								className="flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-bold text-primary transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								to={`/food?q=${encodeURIComponent(searchTerm.trim())}`}
							>
								View all results for “{searchTerm.trim()}”
							</Link>
						</li>
					</ul>
				) : null}
			</div>
		</section>
	);
};

export default HomeSearchBar;
