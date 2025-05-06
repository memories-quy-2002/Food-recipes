import React from "react";
import FoodMenuSection from "./menu/FoodMenuSection";
const FoodMenuBar = ({
	categoryId,
	mealId,
	categories,
	meals,
	onCategoryClick,
	onMealClick,
	onMenuAllClick,
	onChangeSearchTerm,
}) => {
	return (
		<div className="food__menubar">
			<div className="food__menubar__section">
				<h5 className="food__menubar__section__title">Search Food</h5>
				<input
					type="text"
					name="search_recipe"
					placeholder="Search..."
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
		</div>
	);
};

export default FoodMenuBar;
