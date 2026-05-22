import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { getArrayPayload } from "../api/payload";
import Carousel from "../components/home/Carousel";
import HomeMain from "../components/home/HomeMain";
import PageHelmet from "../components/seo/PageHelmet";
import PageState from "../components/ui/PageState";
import "../styles/Home.scss";

const Home = () => {
	const [meals, setMeals] = useState([]);
	const [isLoadingMeals, setIsLoadingMeals] = useState(true);
	const [mealsError, setMealsError] = useState(null);

	useEffect(() => {
		const fetchMeals = async () => {
			try {
				setIsLoadingMeals(true);
				setMealsError(null);
				const response = await axios.get("/meal");
				const mealList = getArrayPayload(response.data, "meals");
				setMeals(
					mealList
						.filter(
							(meal, index, self) =>
								index ===
								self.findIndex((c) => c.id === meal.id)
						)
						.sort((a, b) => a.id - b.id)
				);
			} catch (err) {
				console.error(err);
				setMealsError(
					err.response?.data?.message ||
						"Unable to load featured meals."
				);
			} finally {
				setIsLoadingMeals(false);
			}
		};
		fetchMeals();
	}, []);
	return (
		<div className="container-fluid home">
			<PageHelmet
				title="Home"
				description="Explore featured meals, browse recipe categories, and find your next favorite dish."
				path="/"
			/>
			{isLoadingMeals ? (
				<PageState
					title="Loading featured meals"
					message="Preparing the recipe carousel."
				/>
			) : mealsError ? (
				<PageState
					type="error"
					title="Featured meals could not load"
					message={mealsError}
				/>
			) : (
				<Carousel items={meals} />
			)}
			<HomeMain />
		</div>
	);
};

export default Home;
