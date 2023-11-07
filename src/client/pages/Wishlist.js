import React, { useContext, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useSelector } from "react-redux";
import axios from "../api/axios";
import Layout from "../components/layout/Layout";
import FavoriteRecipe from "../components/wishlist/FavoriteRecipe";
import { RecipeContext } from "../context/RecipeProvider";
import "../styles/Wishlist.scss";
const Wishlist = () => {
	const [wishlist, setWishlist] = useState([]);
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
	const handleDelete = async (recipe_id) => {
		try {
			const response = await axios.delete(
				`/wishlist/${user_id}/${recipe_id}`
			);
			if (response.status === 200) {
				alert("Delete items successfully");
				window.location.reload(false);
			}
		} catch (err) {
			console.error(err);
		}
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
							{favoriteRecipes.map((recipe) => (
								<FavoriteRecipe
									key={recipe.recipe_id}
									recipe={recipe}
									handleDelete={() =>
										handleDelete(recipe.recipe_id)
									}
								/>
							))}
						</ul>
					</div>
				</div>
			</Container>
		</Layout>
	);
};

export default Wishlist;
