import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";

export type SuggestionIntent = "ingredient_match" | "personalized" | "meal_plan" | "substitution";

export type SuggestionRequest = {
	intent: SuggestionIntent;
	ingredients?: string[];
	recipeId?: number;
	ingredient?: string;
};

export type SuggestionResult = {
	recipe_id: number;
	recipe_name: string;
	recipe_description: string | null;
	image_url: string | null;
	match_score: number;
	reason: string;
};

export type SuggestionResponse = {
	intent: SuggestionIntent;
	source: "catalog_rules";
	disclaimer: string;
	suggestions: SuggestionResult[];
};

const PRIVATE_INTENTS: SuggestionIntent[] = ["personalized", "meal_plan"];

export const requestSuggestions = async (
	input: SuggestionRequest,
): Promise<SuggestionResponse> => {
	const endpoint = PRIVATE_INTENTS.includes(input.intent)
		? apiRoutes.userSuggestions
		: apiRoutes.suggestions;
	const response = await axios.post<SuggestionResponse>(endpoint, input);
	return response.data;
};
