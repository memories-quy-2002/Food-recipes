import React from "react";
import FoodMenuSection from "./menu/FoodMenuSection";

const FoodMenuBar = ({
	categoryId,
	mealId,
	searchTerm,
	categories,
	meals,
	onCategoryClick,
	onMealClick,
	onMenuAllClick,
	onChangeSearchTerm,
	onClearFilters,
}) => {
	const hasActiveFilters = Boolean(categoryId || mealId || searchTerm);

	return (
		<aside className="food__menubar">
			<div className="food__menubar__header">
				<div>
					<span>Filters</span>
					<h2>Refine recipes</h2>
				</div>
				<button
					type="button"
					className="food__menubar__clear"
					onClick={onClearFilters}
					disabled={!hasActiveFilters}
				>
					Clear
				</button>
			</div>
			<div className="food__menubar__section">
				<label
					htmlFor="food-search"
					className="food__menubar__section__title"
				>
					Search food
				</label>
				<input
					id="food-search"
					type="text"
					name="search_recipe"
					placeholder="Search recipes..."
					value={searchTerm}
					className="food__menubar__section__search"
					onChange={onChangeSearchTerm}
				/>
			</div>
			<FoodMenuSection
				list={categories}
				listId={categoryId}
				listName="Categories"
				onMenuClick={onCategoryClick}
				onMenuAllClick={onMenuAllClick}
			/>
			<FoodMenuSection
				list={meals}
				listId={mealId}
				listName="Meals"
				onMenuClick={onMealClick}
				onMenuAllClick={onMenuAllClick}
			/>
		</aside>
	);
};

export default FoodMenuBar;
