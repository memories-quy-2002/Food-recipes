import type { ReactElement } from "react";
import type { RecipeSummary } from "@/shared/api/contracts";
import RecipeCard from "@/shared/ui/RecipeCard";

export type FoodContentSectionItemProps = {
	recipe: RecipeSummary;
	viewMode?: "grid" | "list";
};

const FoodContentSectionItem = ({
	recipe,
	viewMode = "grid",
}: FoodContentSectionItemProps): ReactElement => (
	<RecipeCard recipe={recipe} viewMode={viewMode} />
);

export default FoodContentSectionItem;
