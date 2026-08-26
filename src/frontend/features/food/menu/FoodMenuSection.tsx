import type { ReactElement } from "react";
import type { CatalogItem } from "@/shared/api/contracts";
import { cn } from "@/shared/lib/utils";

type MenuFilterField = "categoryId" | "mealId";

export type FoodMenuSectionProps = {
	list: CatalogItem[];
	listId: string;
	listName: "Categories" | "Meals";
	onMenuClick: (id: number) => void;
	onMenuAllClick: (field: MenuFilterField) => void;
};

const FoodMenuSection = ({
	list,
	listId,
	listName,
	onMenuClick,
	onMenuAllClick,
}: FoodMenuSectionProps): ReactElement => {
	const filterName: MenuFilterField = listName === "Categories" ? "categoryId" : "mealId";
	const itemClass = (active: boolean): string => cn("flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active && "bg-accent text-accent-foreground");

	return (
		<section><h3 className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">{listName}</h3><ul className="grid gap-1"><li><button type="button" className={itemClass(!listId)} aria-pressed={!listId} onClick={() => onMenuAllClick(filterName)}><span>All</span><small className="text-muted-foreground">{list.length}</small></button></li>{list.map(({ id, name }) => { const active = Number.parseInt(listId, 10) === id; return <li key={id}><button type="button" className={itemClass(active)} aria-pressed={active} onClick={() => onMenuClick(id)}><span className="truncate">{name}</span></button></li>; })}</ul></section>
	);
};

export default FoodMenuSection;
