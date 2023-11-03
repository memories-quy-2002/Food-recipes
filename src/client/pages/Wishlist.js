import React, { useContext } from "react";
import Layout from "../components/layout/Layout";
import { Container } from "react-bootstrap";
import { RecipeContext } from "../context/RecipeProvider";
import convertImage from "../utils/convertImage";
import "../styles/Wishlist.scss";
const Wishlist = () => {
	const { recipes } = useContext(RecipeContext);
	const handleDelete = () => {
		alert("You deleted an item");
	};
	return (
		<Layout>
			<Container fluid className="wishlist">
				<div className="wishlist__main">
					<div className="wishlist__main__title">
						<h2>Your favorite recipes</h2>
					</div>
					<div className="wishlist__main__content">
						<ul className="wishlist__main__content__list">
							{recipes.map((recipe, index) => (
								<li className="wishlist__main__content__list__item">
									<div className="wishlist__main__content__list__item__img">
										{convertImage(
											recipe.recipe_name,
											"wishlist__main__content__list__item__img"
										)}
									</div>
									<div className="wishlist__main__content__list__item__context">
										<strong>{recipe.recipe_name}</strong>
										<p>Category: {recipe.category_name}</p>
										<p>Meal: {recipe.meal_name}</p>
									</div>

									<button
										type="button"
										className="wishlist__main__content__list__item__button"
										onClick={handleDelete}
									>
										Delete
									</button>
								</li>
							))}
						</ul>
					</div>
				</div>
			</Container>
		</Layout>
	);
};

export default Wishlist;
