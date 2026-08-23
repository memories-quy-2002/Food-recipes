import React from "react";
import convertImage from "@/shared/utils/convertImage";

// The categories endpoint currently includes recipe_count, but the Home should
// remain useful with older/partial payloads too. This order is a product curation
// fallback, not a claim about live popularity; names are the final deterministic
// tie-breaker so database IDs never control prominence.
export const curatedCategoryOrder = [
	"chicken",
	"pasta dishes",
	"pizza",
	"soups",
	"salads",
	"desserts",
	"beef",
	"seafood",
	"sandwiches",
	"appetizers",
	"baking",
	"breads",
	"egg",
	"sweet",
	"main",
];

const categoryPopularity = (category) => {
	const value = category?.recipe_count ?? category?.recipeCount;
	const popularity = Number(value);
	return Number.isFinite(popularity) && popularity >= 0 ? popularity : null;
};

const categoryName = (category) => String(category?.name ?? category?.category_name ?? "");

export const rankCategories = (categories = []) =>
	[...categories].sort((left, right) => {
		const leftPopularity = categoryPopularity(left);
		const rightPopularity = categoryPopularity(right);

		if (leftPopularity !== null && rightPopularity !== null) {
			const popularityDifference = rightPopularity - leftPopularity;
			if (popularityDifference !== 0) return popularityDifference;
		} else if (leftPopularity !== null || rightPopularity !== null) {
			return leftPopularity === null ? 1 : -1;
		}

		const leftPriority = curatedCategoryOrder.indexOf(categoryName(left).toLowerCase());
		const rightPriority = curatedCategoryOrder.indexOf(categoryName(right).toLowerCase());
		const normalizedLeftPriority = leftPriority === -1 ? Number.MAX_SAFE_INTEGER : leftPriority;
		const normalizedRightPriority = rightPriority === -1 ? Number.MAX_SAFE_INTEGER : rightPriority;

		if (normalizedLeftPriority !== normalizedRightPriority) {
			return normalizedLeftPriority - normalizedRightPriority;
		}

		return categoryName(left).localeCompare(categoryName(right), "en", {
			sensitivity: "base",
		});
	});

const CategorySection = ({
	categories,
	selectedCategoryId,
	onCategorySelect,
}) => {
	const rankedCategories = rankCategories(categories).slice(0, 5);

	return (
		<div className="home__main__category">
			<div className="home__sectionHeader">
				<div>
					<span>Cook by mood</span>
					<h3 className="home__main__category__title">Categories</h3>
				</div>
				<a href="/food" className="home__main__category__link">
					Browse all categories
				</a>
			</div>
			<div className="home__main__category__list">
				<button
					type="button"
					className={`home__main__category__list__item home__main__category__list__item--all ${
						selectedCategoryId === "all"
							? "home__main__category__list__item--active"
							: ""
					}`}
					onClick={() => onCategorySelect("all")}
					aria-pressed={selectedCategoryId === "all"}
				>
					<div className="home__main__category__list__item__content">
						<h4>All categories</h4>
						<p>Show featured recipes from every category.</p>
					</div>
				</button>
				{rankedCategories.map(({ id: category_id, name: category_name }) => (
						<button
							key={category_id}
							type="button"
							className={`home__main__category__list__item ${
								Number(selectedCategoryId) === Number(category_id)
									? "home__main__category__list__item--active"
									: ""
							}`}
							onClick={() => onCategorySelect(category_id)}
							aria-pressed={
								Number(selectedCategoryId) === Number(category_id)
							}
						>
							{convertImage(category_name)}
							<div className="home__main__category__list__item__content">
								<h4>{category_name}</h4>
								<span>Filter featured recipes</span>
							</div>
						</button>
					))}
			</div>
		</div>
	);
};

export default CategorySection;
