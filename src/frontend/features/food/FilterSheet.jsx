import React, { useEffect } from "react";

const FilterSheet = ({
	open,
	queryState,
	categories = [],
	meals = [],
	onQueryStateChange,
	onClearFilters,
	onClose,
}) => {
	useEffect(() => {
		if (!open) return undefined;
		const handleKeyDown = (event) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose, open]);

	if (!open) return null;

	const hasActiveFilters = Boolean(queryState.q || queryState.categoryId || queryState.mealId);
	const updateFilter = (field, value) => onQueryStateChange({ [field]: value, page: 1 });

	return (
		<div className="food__filter-sheet-backdrop" role="presentation">
			<section id="food-filter-sheet" className="food__filter-sheet" role="dialog" aria-modal="true" aria-labelledby="food-filter-sheet-title">
				<header className="food__filter-sheet__header">
					<div>
						<span className="food__filter-sheet__eyebrow">Recipe finder</span>
						<h2 id="food-filter-sheet-title">Filter recipes</h2>
					</div>
					<button type="button" className="food__filter-sheet__close" onClick={onClose} aria-label="Close recipe filters">×</button>
				</header>

				<div className="food__filter-sheet__body">
					<label htmlFor="food-filter-search">Search recipes</label>
					<input
						id="food-filter-search"
						type="search"
						value={queryState.q}
						placeholder="Search recipes..."
						onChange={(event) => updateFilter("q", event.target.value)}
					/>

					<fieldset>
						<legend>Category</legend>
						<button type="button" className={!queryState.categoryId ? "is-active" : ""} aria-pressed={!queryState.categoryId} onClick={() => updateFilter("categoryId", "")}>All categories</button>
						{categories.map(({ id, name }) => (
							<button key={id} type="button" className={String(id) === queryState.categoryId ? "is-active" : ""} aria-pressed={String(id) === queryState.categoryId} onClick={() => updateFilter("categoryId", String(id))}>{name}</button>
						))}
					</fieldset>

					<fieldset>
						<legend>Meal</legend>
						<button type="button" className={!queryState.mealId ? "is-active" : ""} aria-pressed={!queryState.mealId} onClick={() => updateFilter("mealId", "")}>All meals</button>
						{meals.map(({ id, name }) => (
							<button key={id} type="button" className={String(id) === queryState.mealId ? "is-active" : ""} aria-pressed={String(id) === queryState.mealId} onClick={() => updateFilter("mealId", String(id))}>{name}</button>
						))}
					</fieldset>
				</div>

				<footer className="food__filter-sheet__footer">
					<button type="button" className="food__filter-sheet__clear" onClick={onClearFilters} disabled={!hasActiveFilters}>Clear all</button>
					<button type="button" className="food__filter-sheet__done" onClick={onClose}>Done</button>
				</footer>
			</section>
		</div>
	);
};

export default FilterSheet;
