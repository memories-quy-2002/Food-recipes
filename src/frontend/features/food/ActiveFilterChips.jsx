import React from "react";
import { X } from "lucide-react";
import Button from "@/shared/ui/Button";

const findLabel = (items, id, fallback) => items.find((item) => String(item.id) === String(id))?.name || `${fallback} ${id}`;
const ActiveFilterChips = ({ queryState, categories = [], meals = [], filterOptions = [], onQueryStateChange, onClearFilters }) => {
	const filterLabel = filterOptions.find((filter) => filter.value === queryState.filter)?.label || queryState.filter;
	const filters = [queryState.q ? { key: "q", label: `Search: ${queryState.q}`, ariaLabel: "Remove search filter" } : null, queryState.categoryId ? { key: "categoryId", label: findLabel(categories, queryState.categoryId, "Category"), ariaLabel: "Remove category filter" } : null, queryState.mealId ? { key: "mealId", label: findLabel(meals, queryState.mealId, "Meal"), ariaLabel: "Remove meal filter" } : null, queryState.filter ? { key: "filter", label: filterLabel, ariaLabel: `Remove ${filterLabel} filter` } : null].filter(Boolean);
	if (!filters.length) return null;
	return <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Active recipe filters"><div className="flex flex-1 flex-wrap gap-2">{filters.map(({ key, label, ariaLabel }) => <span className="inline-flex min-h-11 items-center gap-1 rounded-full border border-primary bg-secondary px-3 text-sm font-semibold text-secondary-foreground" key={key}><span className="max-w-60 truncate">{label}</span><button type="button" className="grid size-11 place-items-center rounded-full hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={ariaLabel} onClick={() => onQueryStateChange({ [key]: "", page: 1 })}><X className="size-3.5" /></button></span>)}</div><Button variant="ghost" size="sm" onClick={onClearFilters}>Clear all</Button></div>;
};
export default ActiveFilterChips;
