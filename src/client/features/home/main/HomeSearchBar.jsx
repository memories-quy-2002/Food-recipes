import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import convertImage from "@/shared/utils/convertImage";

const QUICK_FILTER_LIMIT = 4;

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
	const [searchTerm, setSearchTerm] = useState("");
	const navigate = useNavigate();
	const quickFilters = getQuickFilters(recipes);
	const handleChange = (e) => {
		setSearchTerm(e.target.value);
	};
	const handleQuickFilter = (label) => {
		setSearchTerm(label);
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
					placeholder="Search recipes..."
					className="home__main__search__input"
					onChange={handleChange}
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
				{searchTerm && (
					<ul className="home__main__search__result">
						{filteredRecipes.length > 0 ? (
							filteredRecipes.map((recipe) => (
								<li
									key={recipe.recipe_id}
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
							<li>No recipe found</li>
						)}
					</ul>
				)}
			</div>
		</div>
	);
};

export default HomeSearchBar;
