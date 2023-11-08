import React, { useContext } from "react";
import { RecipeContext } from "../../context/RecipeProvider";
import convertImage from "../../utils/convertImage";
import MenuSection from "./MenuSection";

const MenuBar = ({ categoryId, mealId, categories, meals }) => {
	const { recipes } = useContext(RecipeContext);

	return (
		<div className="food__menubar">
			<div className="food__menubar__section">
				<h5 className="food__menubar__section__title">Search Food</h5>
				<input
					type="text"
					name="search_recipe"
					placeholder="Search..."
				/>
			</div>
			<MenuSection
				list={categories}
				listId={categoryId}
				listName="Categories"
			/>
			<MenuSection list={meals} listId={mealId} listName="Meals" />

			<div className="food__menubar__section">
				<h5 className="food__menubar__section__title">Popular Food</h5>
				<ul className="food__menubar__section__list">
					{recipes.slice(0, 3).map(({ recipe_name, recipe_id }) => (
						<li key={recipe_id}>
							<div className="food__menubar__section__popular">
								{convertImage(
									recipe_name,
									"food__menubar__section__popular__img"
								)}
								<p>{recipe_name}</p>
							</div>
						</li>
					))}
					<li>
						<div></div>
					</li>
				</ul>
			</div>
		</div>
	);
};

export default MenuBar;
