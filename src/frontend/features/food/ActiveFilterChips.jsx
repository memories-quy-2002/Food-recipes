import React from "react";

const findLabel = (items, id, fallback) => items.find((item) => String(item.id) === String(id))?.name || `${fallback} ${id}`;

const ActiveFilterChips = ({ queryState, categories = [], meals = [], onQueryStateChange, onClearFilters }) => {
	const filters = [
		queryState.q ? { key: "q", label: `Search: ${queryState.q}`, ariaLabel: "Remove search filter" } : null,
		queryState.categoryId ? { key: "categoryId", label: findLabel(categories, queryState.categoryId, "Category"), ariaLabel: "Remove category filter" } : null,
		queryState.mealId ? { key: "mealId", label: findLabel(meals, queryState.mealId, "Meal"), ariaLabel: "Remove meal filter" } : null,
	].filter(Boolean);

	if (filters.length === 0) return null;

	return (
		<div className="food__active-filters" aria-label="Active recipe filters">
			<div className="food__active-filters__chips">
				{filters.map(({ key, label, ariaLabel }) => (
					<span className="food__active-filters__chip" key={key}>
						<span>{label}</span>
						<button type="button" aria-label={ariaLabel} onClick={() => onQueryStateChange({ [key]: "", page: 1 })}>×</button>
					</span>
				))}
			</div>
			<button type="button" className="food__active-filters__clear" onClick={onClearFilters}>Clear all</button>
		</div>
	);
};

export default ActiveFilterChips;
