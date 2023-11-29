import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import convertImage from "../../utils/convertImage";
import { Row, Col } from "react-bootstrap";
const PersonalRecipes = ({ user }) => {
	const [personalRecipes, setPersonalRecipes] = useState([]);
	const navigate = useNavigate();
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
	const isInPreviousSevenDays = (date) => {
		const dateToCheck = new Date(date);
		const currentDate = new Date();
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(currentDate.getDate() - 7);
		return dateToCheck >= sevenDaysAgo && dateToCheck <= currentDate;
	};
	return (
		<div className="profile__container__main__personal">
			<h1 className="profile__container__main__personal__title">
				Personal Recipes
			</h1>
			<p className="profile__container__main__personal__declaration">
				Here is a list of recipe you have added to Food Recipe
			</p>
			{personalRecipes.length > 0 ? (
				<div className="profile__container__main__personal__container">
					<Row className="profile__container__main__personal__container__summary">
						<Col md={6}>
							<div className="profile__container__main__personal__container__summary__item">
								<strong>{personalRecipes.length}</strong>
								<p>Total</p>
							</div>{" "}
						</Col>
						<Col md={6}>
							<div className="profile__container__main__personal__container__summary__item">
								<strong>
									{
										personalRecipes.filter((recipe) =>
											isInPreviousSevenDays(
												recipe.date_added
											)
										).length
									}
								</strong>
								<p>Previous 7 days</p>
							</div>{" "}
						</Col>
					</Row>
					<ul className="profile__container__main__personal__container__list">
						{personalRecipes.map((recipe) => (
							<li className="profile__container__main__personal__container__list__item">
								<div>
									{convertImage(
										recipe.recipe_name,
										"profile__container__main__personal__container__list__item__img"
									)}
								</div>
								<div className="profile__container__main__personal__container__list__item__context">
									<div className="d-flex gap-3 flex-column">
										<h5>{recipe.recipe_name}</h5>
										<div className="d-flex gap-3">
											<div>
												<strong>Category</strong>{" "}
												<p>{recipe.category_name}</p>
											</div>
											<div>
												<strong>Meal</strong>{" "}
												<p>{recipe.meal_name}</p>
											</div>
										</div>
									</div>
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
						onClick={() => navigate("/food/add")}
					>
						Add a recipe +
					</button>
				</div>
			)}
		</div>
	);
};

export default PersonalRecipes;
