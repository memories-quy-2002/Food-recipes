import { MEAL_SLOTS, type MealPlanItem, type MealSlot } from "../api/planningApi";
import type { PlanningDay } from "../api/planningDates";
import MealSlotComponent from "./MealSlot";

type MealPlanGridProps = { days: PlanningDay[]; items: MealPlanItem[]; onAdd: (date: string, slot: MealSlot) => void; onEdit: (item: MealPlanItem) => void; onRemove: (item: MealPlanItem) => void; onOpenRecipe?: (item: MealPlanItem) => void; isRemoving?: boolean };
const MealPlanGrid = ({ days, items, onAdd, onEdit, onRemove, onOpenRecipe, isRemoving = false }: MealPlanGridProps) => {
	const itemsByKey = new Map(items.map((item) => [`${item.planned_date.slice(0, 10)}:${item.slot}`, item]));
	return <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7" aria-label="Weekly meal plan">{days.map((day) => <section className="min-w-0 rounded-2xl border border-border bg-muted/20 p-3 shadow-sm" key={day.date} aria-labelledby={`planning-day-${day.date}`}><header className="mb-3 border-b border-border pb-3"><h3 id={`planning-day-${day.date}`} className="text-lg font-black">{day.label.split(",")[0]}</h3><span className="text-sm text-muted-foreground">{day.label.split(", ")[1]}</span></header><div className="grid gap-3">{MEAL_SLOTS.map((slot) => <MealSlotComponent key={`${day.date}-${slot}`} day={day} slot={slot} item={itemsByKey.get(`${day.date}:${slot}`)} onAdd={onAdd} onEdit={onEdit} onRemove={onRemove} onOpenRecipe={onOpenRecipe} isRemoving={isRemoving} />)}</div></section>)}</section>;
};
export default MealPlanGrid;
