import { BsTrash3 } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import type { ReactElement } from "react";
import convertImage from "@/shared/utils/convertImage";
import ratingStar from "@/shared/utils/ratingStar";
import { formatSavedAt } from "./savedRecipe";

export type WishlistRecipe = {
	recipe_id?: number | string | null;
	recipe_name?: string | null;
	recipe_description?: string | null;
	prep_time_minutes?: number;
	cook_time_minutes?: number;
	total_time_minutes?: number;
	date_added?: string | null;
	image_url?: string | null;
	user_id?: number;
	meal_id?: number;
	meal_name?: string | null;
	meal_description?: string | null;
	category_id?: number;
	category_name?: string | null;
	overall_score?: number;
	num_ratings?: number;
	dietary_tags?: string[];
};

type FavoriteRecipeProps = {
	recipe: WishlistRecipe;
	savedAt?: string | null;
	handleShowModal: (triggeringButton: HTMLButtonElement) => void;
};

const FavoriteRecipe = ({ recipe, savedAt, handleShowModal }: FavoriteRecipeProps): ReactElement => {
	const navigate = useNavigate();
	return (
		<li className="wishlist__main__content__list__item">
			<div className="wishlist__main__content__list__item__media">
				{convertImage(
					recipe.recipe_name || "Recipe image",
					"wishlist__main__content__list__item__img",
					recipe.image_url
				)}
			</div>
			<div className="wishlist__main__content__list__item__context">
				<div className="wishlist__main__content__list__item__chips">
					<span>{recipe.category_name}</span>
					<span>{recipe.meal_name}</span>
				</div>
				<strong>{recipe.recipe_name}</strong>
				<div className="wishlist__main__content__list__item__rating">
					<div>{ratingStar(recipe.overall_score, "orange")}</div>
					<span>
						{Number(recipe.overall_score || 0).toFixed(1)} (
						{recipe.num_ratings} ratings)
					</span>
				</div>
				<span className="wishlist__main__content__list__item__saved-at">
					{formatSavedAt(savedAt)}
				</span>
			</div>
			<div className="wishlist__main__content__list__item__actions">
				<button
					type="button"
					className="wishlist__main__content__list__item__button"
					onClick={() => navigate(`/recipe?id=${recipe.recipe_id}`)}
				>
					View
				</button>
				<button
					type="button"
					className="wishlist__main__content__list__item__button wishlist__main__content__list__item__button--danger"
					onClick={(event) => handleShowModal(event.currentTarget)}
					aria-label={`Remove ${recipe.recipe_name}`}
				>
					<BsTrash3 />
				</button>
			</div>
		</li>
	);
};

export default FavoriteRecipe;
