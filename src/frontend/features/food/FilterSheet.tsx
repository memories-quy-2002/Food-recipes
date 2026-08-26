import { useEffect, useRef, type KeyboardEvent, type MouseEvent, type ReactElement } from "react";
import { X } from "lucide-react";
import type { CatalogItem } from "@/shared/api/contracts";
import { RECIPE_FILTERS, type RecipeDiscoveryState } from "@/features/food/api/useRecipesQuery";
import type { RecipeFilterOption } from "./filterOptions";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import { cn } from "@/shared/lib/utils";

type RecipeFilterField = "q" | "categoryId" | "mealId" | "filter";
type QueryStateChange = Partial<RecipeDiscoveryState>;

const isRecipeFilter = (value: string): value is RecipeDiscoveryState["filter"] =>
	value === "" || RECIPE_FILTERS.includes(value as (typeof RECIPE_FILTERS)[number]);

const updateFilterChange = (field: RecipeFilterField, value: string): QueryStateChange => {
	switch (field) {
		case "q":
			return { q: value, page: 1 };
		case "categoryId":
			return { categoryId: value, page: 1 };
		case "mealId":
			return { mealId: value, page: 1 };
		case "filter":
			return { filter: isRecipeFilter(value) ? value : "", page: 1 };
	}
};

type FilterGroup = {
	label: "Category" | "Meal";
	field: "categoryId" | "mealId";
	items: CatalogItem[];
};

export type FilterSheetProps = {
	open: boolean;
	queryState: RecipeDiscoveryState;
	categories?: CatalogItem[];
	meals?: CatalogItem[];
	filterOptions?: readonly RecipeFilterOption[];
	onQueryStateChange: (changes: QueryStateChange) => void;
	onClearFilters: () => void;
	onClose: () => void;
};

const FilterSheet = ({
	open,
	queryState,
	categories = [],
	meals = [],
	filterOptions = [],
	onQueryStateChange,
	onClearFilters,
	onClose,
}: FilterSheetProps): ReactElement | null => {
	const dialogRef = useRef<HTMLElement | null>(null);
	const searchInputRef = useRef<HTMLInputElement | null>(null);
	useEffect(() => {
		if (!open) return undefined;
		const previouslyFocused = document.activeElement;
		searchInputRef.current?.focus();
		const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
			if (event.key === "Escape") onClose();
		};
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", handleKeyDown);
			if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
		};
	}, [onClose, open]);

	const trapFocus = (event: KeyboardEvent<HTMLElement>): void => {
		if (event.key !== "Tab") return;
		const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]") ?? []);
		if (!focusable.length) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	};

	if (!open) return null;
	const hasActiveFilters = Boolean(queryState.q || queryState.categoryId || queryState.mealId || queryState.filter);
	const updateFilter = (field: RecipeFilterField, value: string): void =>
		onQueryStateChange(updateFilterChange(field, value));
	const chipClass = (active: boolean): string => cn("min-h-11 rounded-full border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent");
	const filterGroups: FilterGroup[] = [
		{ label: "Category", field: "categoryId", items: categories },
		{ label: "Meal", field: "mealId", items: meals },
	];

	return (
		<div className="fixed inset-0 z-50 bg-foreground/45" role="presentation" onMouseDown={(event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose(); }}>
			<section ref={dialogRef} id="food-filter-sheet" className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="food-filter-sheet-title" onKeyDown={trapFocus}>
				<header className="flex items-start justify-between border-b border-border p-5"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Recipe finder</p><h2 id="food-filter-sheet-title" className="mt-1 text-2xl font-black">Filter recipes</h2></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close recipe filters"><X className="size-5" /></Button></header>
				<div className="max-h-[60dvh] space-y-6 overflow-y-auto p-5">
					<div className="grid gap-2"><label htmlFor="food-filter-search" className="text-sm font-bold">Search recipes</label><Input ref={searchInputRef} id="food-filter-search" type="search" value={queryState.q} placeholder="Search recipes…" onChange={(event) => updateFilter("q", event.target.value)} /></div>
					<fieldset><legend className="mb-3 text-sm font-black">Helpful filters</legend><div className="flex flex-wrap gap-2">{filterOptions.map(({ value, label }) => <button key={value} type="button" className={chipClass(queryState.filter === value)} aria-pressed={queryState.filter === value} onClick={() => updateFilter("filter", queryState.filter === value ? "" : value)}>{label}</button>)}</div></fieldset>
					{filterGroups.map(({ label, field, items }) => <fieldset key={field}><legend className="mb-3 text-sm font-black">{label}</legend><div className="flex flex-wrap gap-2"><button type="button" className={chipClass(!queryState[field])} aria-pressed={!queryState[field]} onClick={() => updateFilter(field, "")}>All {label.toLowerCase()}s</button>{items.map(({ id, name }) => <button key={id} type="button" className={chipClass(String(id) === queryState[field])} aria-pressed={String(id) === queryState[field]} onClick={() => updateFilter(field, String(id))}>{name}</button>)}</div></fieldset>)}
				</div>
				<footer className="grid grid-cols-2 gap-3 border-t border-border bg-card p-5"><Button variant="outline" onClick={onClearFilters} disabled={!hasActiveFilters}>Clear all</Button><Button onClick={onClose}>Show results</Button></footer>
			</section>
		</div>
	);
};

export default FilterSheet;
