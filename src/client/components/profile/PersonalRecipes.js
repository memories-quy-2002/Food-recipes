import React, { useEffect, useState } from "react";
import axios from "../../api/axios";
import convertImage from "../../utils/convertImage";
const PersonalRecipes = ({ user }) => {
	const [personalRecipes, setPersonalRecipes] = useState([]);
	useEffect(() => {
		const fetchPersonalRecipes = async () => {
			try {
				const response = await axios.get(
					`/recipe/user/${user.user_id}`
				);
				if (response.status === 200) {
					setPersonalRecipes(response.data.recipes);
				}
			} catch (err) {
				console.error(err);
			}
		};
		fetchPersonalRecipes();
	}, [user.user_id]);
	console.log(personalRecipes);
	return (
		<div className="profile__container__main__personal">
			<h1 className="profile__container__main__personal__title">
				Personal Recipes
			</h1>
			<p className="profile__container__main__personal__declaration">
				Here is a list of recipe you have added to Food Recipe
			</p>
			{personalRecipes ? (
				<div className="profile__container__main__personal__container">
					<ul>
						{personalRecipes.map((recipe) => (
							<li>
								<div>{convertImage(recipe.recipe_name)}</div>
								<div>
									<strong>{recipe.recipe_name}</strong>
									<p>{recipe.category_name}</p>
								</div>
							</li>
						))}
					</ul>
				</div>
			) : (
				<div className="profile__container__main__personal__container">
					<strong
						style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
					>
						You haven't created any recipes yet
					</strong>
					<p style={{ marginBottom: "2rem" }}>
						To add a recipe click the button below
					</p>
					<button
						className="profile__container__main__personal__container__button"
						type="button"
					>
						Add a recipe +
					</button>
				</div>
			)}
		</div>
	);
};

export default PersonalRecipes;
