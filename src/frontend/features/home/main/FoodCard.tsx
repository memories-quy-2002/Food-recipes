import type { ReactElement } from "react";
import type { RecipeSummary } from "@/shared/api/contracts";
import RecipeCard from "@/shared/ui/RecipeCard";

export type FoodCardProps = {
	id: number;
	name: string;
	category?: string | null;
	meal?: string | null;
	ratings?: number | null;
	score?: number | null;
	imageUrl?: string | null;
	favorite?: boolean;
	onClickFavorite: (recipeId: number) => void | Promise<void>;
	totalTimeMinutes?: number | null;
	dietaryTags?: string[];
};

const FoodCard = ({
	id,
	name,
	category,
	meal,
	ratings,
	score,
	imageUrl,
	favorite,
	onClickFavorite,
	totalTimeMinutes,
	dietaryTags,
}: FoodCardProps): ReactElement => (
	<RecipeCard
		recipe={
			{
				recipe_id: id,
				recipe_name: name,
				recipe_description: null,
				date_added: null,
				prep_time_minutes: 0,
				cook_time_minutes: 0,
				user_id: 0,
				category_name: category ?? undefined,
				meal_name: meal ?? undefined,
				num_ratings: ratings ?? undefined,
				overall_score: score ?? undefined,
				image_url: imageUrl ?? null,
				total_time_minutes: totalTimeMinutes ?? 0,
				dietary_tags: dietaryTags,
			} satisfies RecipeSummary
		}
		favorite={favorite}
		onToggleFavorite={() => onClickFavorite(id)}
	/>
);

export default FoodCard;
