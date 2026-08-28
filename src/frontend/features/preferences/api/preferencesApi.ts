import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";

export type FoodPreferences = {
	diet: string | null;
	avoidedAllergens: string[];
	dislikedIngredients: string[];
	preferredCuisines: string[];
	cookingSkill: string | null;
	maxWeekdayCookMinutes: number | null;
	defaultServings: number;
	maxCaloriesPerServing: number | null;
	minProteinGrams: number | null;
	strictDislikes: boolean;
};

export const getFoodPreferences = async (): Promise<FoodPreferences> => {
	const response = await axios.get<FoodPreferences>(apiRoutes.userFoodPreferences);
	return response.data;
};

export const replaceFoodPreferences = async (
	preferences: FoodPreferences,
): Promise<FoodPreferences> => {
	const response = await axios.put<FoodPreferences>(
		apiRoutes.userFoodPreferences,
		preferences,
	);
	return response.data;
};
