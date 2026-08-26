import type { ReactElement } from "react";
import { X } from "lucide-react";
import type { CatalogItem } from "@/shared/api/contracts";
import type { RecipeDiscoveryState } from "@/features/food/api/useRecipesQuery";
import type { RecipeFilterOption } from "./filterOptions";
import Button from "@/shared/ui/Button";

type RecipeFilterField = "q" | "categoryId" | "mealId" | "filter";
type QueryStateChange = Partial<RecipeDiscoveryState>;

const findLabel = (items: CatalogItem[], id: string, fallback: string): string =>
	items.find((item) => String(item.id) === String(id))?.name || `${fallback} ${id}`;

type FilterChip = {
	key: RecipeFilterField;
	label: string;
	ariaLabel: string;
};

const clearFilterChange = (field: RecipeFilterField): QueryStateChange => {
	switch (field) {
		case "q":
			return { q: "", page: 1 };
		case "categoryId":
			return { categoryId: "", page: 1 };
		case "mealId":
			return { mealId: "", page: 1 };
		case "filter":
			return { filter: "", page: 1 };
	}
};

export type ActiveFilterChipsProps = {
	queryState: RecipeDiscoveryState;
	categories?: CatalogItem[];
	meals?: CatalogItem[];
	filterOptions?: readonly RecipeFilterOption[];
	onQueryStateChange: (changes: QueryStateChange) => void;
	onClearFilters: () => void;
};

const ActiveFilterChips = ({
	queryState,
	categories = [],
	meals = [],
	filterOptions = [],
	onQueryStateChange,
	onClearFilters,
}: ActiveFilterChipsProps): ReactElement | null => {
	const filterLabel = filterOptions.find((filter) => filter.value === queryState.filter)?.label || queryState.filter;
	const filters: Array<FilterChip | null> = [
		queryState.q ? { key: "q", label: `Search: ${queryState.q}`, ariaLabel: "Remove search filter" } : null,
		queryState.categoryId ? { key: "categoryId", label: findLabel(categories, queryState.categoryId, "Category"), ariaLabel: "Remove category filter" } : null,
		queryState.mealId ? { key: "mealId", label: findLabel(meals, queryState.mealId, "Meal"), ariaLabel: "Remove meal filter" } : null,
		queryState.filter ? { key: "filter", label: filterLabel, ariaLabel: `Remove ${filterLabel} filter` } : null,
	];
	const activeFilters = filters.filter((filter): filter is FilterChip => filter !== null);

	if (!activeFilters.length) return null;
	return (
		<div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Active recipe filters">
			<div className="flex flex-1 flex-wrap gap-2">
				{activeFilters.map(({ key, label, ariaLabel }) => (
					<span className="inline-flex min-h-11 items-center gap-1 rounded-full border border-primary bg-secondary px-3 text-sm font-semibold text-secondary-foreground" key={key}>
						<span className="max-w-60 truncate">{label}</span>
						<button type="button" className="grid size-11 place-items-center rounded-full hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={ariaLabel} onClick={() => onQueryStateChange(clearFilterChange(key))}><X className="size-3.5" /></button>
					</span>
				))}
			</div>
			<Button variant="ghost" size="sm" onClick={onClearFilters}>Clear all</Button>
		</div>
	);
};

export default ActiveFilterChips;
