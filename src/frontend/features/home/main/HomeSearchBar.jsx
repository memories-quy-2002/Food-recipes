import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import convertImage from "@/shared/utils/convertImage";

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

const HomeSearchBar = ({ recipes = [] }) => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const searchTerm = searchParams.get("q") || "";
	const quickFilters = getQuickFilters(recipes);
	const [activeIndex, setActiveIndex] = useState(-1);
	const [isResultListOpen, setIsResultListOpen] = useState(Boolean(searchTerm));
	const updateSearchTerm = (value) => {
		setSearchParams(
			(currentParams) => {
				const nextParams = new URLSearchParams(currentParams);
				if (value.trim()) {
					nextParams.set("q", value);
				} else {
					nextParams.delete("q");
				}
				return nextParams;
			},
			{ replace: true }
		);
	};
	const handleChange = (e) => {
		setActiveIndex(-1);
		setIsResultListOpen(Boolean(e.target.value.trim()));
		updateSearchTerm(e.target.value);
	};
	const handleQuickFilter = (label) => {
		setActiveIndex(-1);
		setIsResultListOpen(true);
		updateSearchTerm(label);
	};
	const filteredRecipes = recipes.filter((recipe) =>
		[
			recipe.recipe_name,
			recipe.category_name,
			recipe.meal_name,
		].some((value) =>
			normalizeLabel(value)
				.toLocaleLowerCase()
				.includes(searchTerm.trim().toLocaleLowerCase())
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
			setActiveIndex((currentIndex) =>
				currentIndex < filteredRecipes.length - 1 ? currentIndex + 1 : 0
			);
			return;
		}

		if (event.key === "ArrowUp" && filteredRecipes.length > 0) {
			event.preventDefault();
			setIsResultListOpen(true);
			setActiveIndex((currentIndex) =>
				currentIndex > 0 ? currentIndex - 1 : filteredRecipes.length - 1
			);
			return;
		}

		if (
			event.key === "Enter" &&
			isResultListOpen &&
			filteredRecipes[activeIndex]
		) {
			event.preventDefault();
			navigate(`/recipe?id=${filteredRecipes[activeIndex].recipe_id}`);
		}
	};
	const activeDescendant =
		isResultListOpen && activeIndex >= 0
			? `recipe-search-option-${activeIndex}`
			: undefined;
	return (
		<div className="home__main__title">
			<span className="home__main__title__eyebrow">Start with a craving</span>
			<h1>What do you want to cook?</h1>
			<p>
				Search recipes by name, category, or meal type and get cooking.
			</p>
			<div className="home__main__search">
				<input
					type="text"
					placeholder="Search recipes…"
					aria-label="Search recipes"
					role="combobox"
					aria-autocomplete="list"
					aria-controls={SEARCH_RESULTS_ID}
					aria-expanded={Boolean(searchTerm) && isResultListOpen}
					aria-activedescendant={activeDescendant}
					className="home__main__search__input"
					value={searchTerm}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
				></input>
				{quickFilters.length > 0 && (
					<div
						className="home__main__search__filters"
						aria-label="Popular recipe filters"
					>
						{quickFilters.map((label) => (
							<button
								key={label}
								type="button"
								className="home__main__search__filter"
								onClick={() => handleQuickFilter(label)}
							>
								{label}
							</button>
						))}
					</div>
				)}
				{searchTerm && isResultListOpen && (
					<ul
						id={SEARCH_RESULTS_ID}
						role="listbox"
						aria-label="Recipe search results"
						aria-live="polite"
						className="home__main__search__result"
					>
						{filteredRecipes.length > 0 ? (
							filteredRecipes.map((recipe) => (
								<li
									key={recipe.recipe_id}
									id={`recipe-search-option-${filteredRecipes.indexOf(recipe)}`}
									role="option"
									tabIndex={-1}
									aria-selected={
										filteredRecipes.indexOf(recipe) === activeIndex
									}
									onClick={() =>
										navigate(
											`/recipe?id=${recipe.recipe_id}`
										)
									}
								>
									{convertImage(
										recipe.recipe_name,
										"home__main__search__result__img",
										recipe.image_url
									)}
									<p>{recipe.recipe_name}</p>
								</li>
							))
						) : (
							<li role="option" aria-disabled="true">
								No recipe found
							</li>
						)}
					</ul>
				)}
			</div>
		</div>
	);
};

export default HomeSearchBar;
