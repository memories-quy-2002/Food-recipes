import React, { useContext, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useSelector } from "react-redux";
import axios from "../api/axios";
import FavoriteRecipe from "../components/wishlist/FavoriteRecipe";
import { RecipeContext } from "../context/RecipeProvider";
import "../styles/Wishlist.scss";
const Wishlist = () => {
	const [wishlist, setWishlist] = useState([]);
	const [showModal, setShowModal] = useState(false);
	const [recipeId, setRecipeId] = useState(null);
	const { recipes } = useContext(RecipeContext);
	const { local, session } = useSelector(({ auth }) => auth);
	const isAuthenticated = local.isAuthenticated || session.isAuthenticated;
	const user_id = isAuthenticated
		? local.isAuthenticated
			? local.user.user_id
			: session.user.user_id
		: 0;
	useEffect(() => {
		const fetchFavorites = async () => {
			const response = await axios.get(`/wishlist/${user_id}`);
			setWishlist(response.data.wishlist);
		};
		fetchFavorites();
	}, [user_id]);
	const favoriteRecipes = recipes.filter((recipe) =>
		wishlist.some(
			(wishlistRecipe) => wishlistRecipe.recipe_id === recipe.recipe_id
		)
	);

	const handleShowModal = (recipe_id) => {
		setShowModal(true);
		setRecipeId(recipe_id);
	};

	const handleDelete = async () => {
		try {
			const response = await axios.delete(
				`/wishlist/${user_id}/${recipeId}`
			);
			if (response.status === 200) {
				window.location.reload(false);
			}
		} catch (err) {
			console.error(err);
		}
	};
	return (
		<Container fluid className="wishlist">
			<div className="wishlist__main">
				<div className="wishlist__main__title">
					<h2>Your favorite recipes</h2>
				</div>
				<div className="wishlist__main__content">
					<ul className="wishlist__main__content__list">
						{favoriteRecipes.map((recipe) => (
							<FavoriteRecipe
								key={recipe.recipe_id}
								recipe={recipe}
								handleShowModal={() =>
									handleShowModal(recipe.recipe_id)
								}
							/>
						))}
					</ul>
				</div>
			</div>
			{showModal && (
				<div className="wishlist__modal">
					<div className="wishlist__modal__content">
						<h3>Delete Recipe</h3>
						<p>Are you sure you want to delete this recipe?</p>
						<div className="wishlist__modal__buttons">
							<button
								className="btn btn-danger"
								type="submit"
								onClick={handleDelete}
							>
								Delete
							</button>
							<button
								className="btn btn-primary"
								type="button"
								onClick={() => setShowModal(false)}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</Container>
	);
};

export default Wishlist;
