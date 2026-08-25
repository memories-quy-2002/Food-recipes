import React from "react";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import { Card } from "@/shared/ui/Card";
import FoodMenuSection from "./menu/FoodMenuSection";

const FoodMenuBar = ({ categoryId, mealId, searchTerm, categories, meals, onCategoryClick, onMealClick, onMenuAllClick, onChangeSearchTerm, onClearFilters }) => {
	const hasActiveFilters = Boolean(categoryId || mealId || searchTerm);
	return (
		<Card as="aside" className="sticky top-24 overflow-hidden p-4">
			<div className="mb-5 flex items-start justify-between gap-3">
				<div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Filters</p><h2 className="mt-1 text-xl font-black">Refine recipes</h2></div>
				<Button variant="ghost" size="sm" onClick={onClearFilters} disabled={!hasActiveFilters}>Clear</Button>
			</div>
			<div className="mb-5 grid gap-2"><label htmlFor="food-search" className="text-sm font-bold">Search recipes</label><Input id="food-search" type="search" name="search_recipe" placeholder="Name or keyword…" value={searchTerm} onChange={onChangeSearchTerm} /></div>
			<div className="grid gap-5"><FoodMenuSection list={categories} listId={categoryId} listName="Categories" onMenuClick={onCategoryClick} onMenuAllClick={onMenuAllClick} /><FoodMenuSection list={meals} listId={mealId} listName="Meals" onMenuClick={onMealClick} onMenuAllClick={onMenuAllClick} /></div>
		</Card>
	);
};
export default FoodMenuBar;
