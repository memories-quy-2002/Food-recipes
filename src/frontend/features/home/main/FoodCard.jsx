import RecipeCard from "@/shared/ui/RecipeCard";

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
}) => (
	<RecipeCard
		recipe={{
			recipe_id: id,
			recipe_name: name,
			category_name: category,
			meal_name: meal,
			num_ratings: ratings,
			overall_score: score,
			image_url: imageUrl,
			total_time_minutes: totalTimeMinutes,
			dietary_tags: dietaryTags,
		}}
		favorite={favorite}
		onToggleFavorite={() => onClickFavorite(id)}
	/>
);

export default FoodCard;
