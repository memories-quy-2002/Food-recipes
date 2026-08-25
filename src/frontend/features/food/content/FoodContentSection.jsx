import React from "react";
import { cn } from "@/shared/lib/utils";
import FoodContentSectionItem from "./FoodContentSectionItem";
const FoodContentSection = ({ id, name, recipes, viewMode }) => <section key={id} className="mb-8"><h3 className="mb-3 text-xl font-black">{name}</h3><div className={cn("grid gap-4", viewMode === "grid" ? "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1")}>{recipes.filter((recipe) => recipe.category_name === name).map((recipe) => <FoodContentSectionItem key={recipe.recipe_id} recipe={recipe} viewMode={viewMode} />)}</div></section>;
export default FoodContentSection;
