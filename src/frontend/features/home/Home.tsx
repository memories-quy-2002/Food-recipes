import React, { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import axios from "@/shared/api/axios";
import { getArrayPayload } from "@/shared/api/payload";
import { apiRoutes } from "@/shared/api/routes";
import Carousel from "@/features/home/Carousel";
import type { CarouselItemData } from "@/features/home/Carousel";
import HomeMain from "@/features/home/HomeMain";
import PageHelmet from "@/shared/seo/PageHelmet";
import PageState from "@/shared/ui/PageState";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const toFeaturedMeal = (value: unknown): CarouselItemData | null => {
	if (!isRecord(value) || typeof value.id !== "number") return null;
	const name = typeof value.name === "string" ? value.name : value.meal_name;
	if (typeof name !== "string" || name.trim().length === 0) return null;

	return {
		id: value.id,
		name,
		description:
			typeof value.description === "string"
				? value.description
				: typeof value.meal_description === "string"
					? value.meal_description
					: null,
		imageName: typeof value.imageName === "string" ? value.imageName : undefined,
	};
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
	if (!isAxiosError(error)) return fallback;
	const data = error.response?.data;
	return isRecord(data) && typeof data.message === "string" ? data.message : fallback;
};

const Home = (): React.ReactElement => {
	const [meals, setMeals] = useState<CarouselItemData[]>([]);
	const [isLoadingMeals, setIsLoadingMeals] = useState(true);
	const [mealsError, setMealsError] = useState<string | null>(null);

	useEffect(() => {
		const fetchMeals = async () => {
			try {
				setIsLoadingMeals(true);
				setMealsError(null);
				const response = await axios.get<unknown>(apiRoutes.meals);
				const mealList = getArrayPayload(response.data, "meals")
					.map(toFeaturedMeal)
					.filter((meal): meal is CarouselItemData => meal !== null);
				setMeals(
					mealList
						.filter(
							(meal, index, self) =>
								index === self.findIndex((candidate) => candidate.id === meal.id)
						)
						.sort((a, b) => (a.id ?? Number.MAX_SAFE_INTEGER) - (b.id ?? Number.MAX_SAFE_INTEGER))
				);
			} catch (error: unknown) {
				console.error(error);
				setMealsError(getApiErrorMessage(error, "Unable to load featured meals."));
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
