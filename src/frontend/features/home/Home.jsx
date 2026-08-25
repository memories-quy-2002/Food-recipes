import React, { useEffect, useState } from "react";
import axios from "@/shared/api/axios";
import { getArrayPayload } from "@/shared/api/payload";
import { apiRoutes } from "@/shared/api/routes";
import Carousel from "@/features/home/Carousel";
import HomeMain from "@/features/home/HomeMain";
import PageHelmet from "@/shared/seo/PageHelmet";
import PageState from "@/shared/ui/PageState";

const Home = () => {
	const [meals, setMeals] = useState([]);
	const [isLoadingMeals, setIsLoadingMeals] = useState(true);
	const [mealsError, setMealsError] = useState(null);

	useEffect(() => {
		const fetchMeals = async () => {
			try {
				setIsLoadingMeals(true);
				setMealsError(null);
				const response = await axios.get(apiRoutes.meals);
				const mealList = getArrayPayload(response.data, "meals");
				setMeals(
					mealList
						.filter(
							(meal, index, self) =>
								index === self.findIndex((candidate) => candidate.id === meal.id)
						)
						.sort((a, b) => a.id - b.id)
				);
			} catch (err) {
				console.error(err);
				setMealsError(err.response?.data?.message || "Unable to load featured meals.");
			} finally {
				setIsLoadingMeals(false);
			}
		};
		fetchMeals();
	}, []);

	return (
		<main className="min-h-screen bg-background text-foreground">
			<PageHelmet
				title="Home"
				description="Explore featured meals, browse recipe categories, and find your next favorite dish."
				path="/"
			/>
			{isLoadingMeals ? (
				<PageState title="Loading featured meals" message="Preparing the recipe carousel." />
			) : mealsError ? (
				<PageState type="error" title="Featured meals could not load" message={mealsError} />
			) : (
				<Carousel items={meals} />
			)}
			<HomeMain />
		</main>
	);
};

export default Home;
