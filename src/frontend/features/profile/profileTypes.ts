import type { AuthUser } from "@/features/auth/api/authSessionApi";
import type { RecipeStatus, RecipeSummary } from "@/shared/api/contracts";

export type ProfileUser = AuthUser & {
	full_name?: string | null;
	phone?: string | null;
	address?: string | null;
};

export type ProfilePage = "" | "password" | "recipes" | "reviews";

export type PersonalRecipe = Partial<RecipeSummary> & {
	recipe_id: number;
	recipe_name?: string | null;
	status?: RecipeStatus | string | null;
	date_added?: string | null;
};

export type ProfileRating = {
	rating_id: number;
	recipe_id: number;
	recipe_name: string;
	image_url: string | null;
	score: number | string;
	review: string | null;
	date_added?: string | null;
};

export const isPersonalRecipe = (value: unknown): value is PersonalRecipe =>
	typeof value === "object" &&
	value !== null &&
	"recipe_id" in value &&
	typeof value.recipe_id === "number" &&
	Number.isSafeInteger(value.recipe_id) &&
	value.recipe_id > 0;

export const isProfileRating = (value: unknown): value is ProfileRating =>
	typeof value === "object" &&
	value !== null &&
	"rating_id" in value &&
	typeof value.rating_id === "number" &&
	"recipe_id" in value &&
	typeof value.recipe_id === "number" &&
	"recipe_name" in value &&
	typeof value.recipe_name === "string" &&
	"score" in value &&
	(typeof value.score === "number" || typeof value.score === "string") &&
	"review" in value &&
	(typeof value.review === "string" || value.review === null) &&
	("image_url" in value ? typeof value.image_url === "string" || value.image_url === null : true);
