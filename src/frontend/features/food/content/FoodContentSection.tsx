import type { ReactElement } from "react";
import type { RecipeSummary } from "@/shared/api/contracts";
import { cn } from "@/shared/lib/utils";
import FoodContentSectionItem from "./FoodContentSectionItem";

export type FoodContentSectionProps = {
	id: number;
	name: string;
	recipes: RecipeSummary[];
	viewMode: "grid" | "list";
};

const FoodContentSection = ({
	id,
	name,
	recipes,
	viewMode,
}: FoodContentSectionProps): ReactElement => (
	<section key={id} className="mb-8">
		<h3 className="mb-3 text-xl font-black">{name}</h3>
		<div className={cn("grid gap-4", viewMode === "grid" ? "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1")}>
			{recipes.filter((recipe) => recipe.category_name === name).map((recipe) => <FoodContentSectionItem key={recipe.recipe_id} recipe={recipe} viewMode={viewMode} />)}
		</div>
	</section>
);

export default FoodContentSection;
