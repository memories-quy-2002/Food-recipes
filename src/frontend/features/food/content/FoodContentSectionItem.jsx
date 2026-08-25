import React from "react";
import RecipeCard from "@/shared/ui/RecipeCard";

const FoodContentSectionItem = ({ recipe, viewMode = "grid" }) => (
	<RecipeCard recipe={recipe} viewMode={viewMode} />
);

export default FoodContentSectionItem;
