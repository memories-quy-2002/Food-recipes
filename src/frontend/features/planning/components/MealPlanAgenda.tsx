import { Plus } from "lucide-react";
import Button from "@/shared/ui/Button";
import { MEAL_SLOTS, type MealPlanItem, type MealSlot } from "../api/planningApi";
import type { PlanningDay } from "../api/planningDates";
import MealSlotComponent from "./MealSlot";

type MealPlanAgendaProps = {
	days: PlanningDay[];
	items: MealPlanItem[];
	onAdd: (date: string, slot: MealSlot) => void;
	onEdit: (item: MealPlanItem) => void;
	onRemove: (item: MealPlanItem) => void;
	onOpenRecipe?: (item: MealPlanItem) => void;
	isRemoving?: boolean;
};

const MealPlanAgenda = ({ days, items, onAdd, onEdit, onRemove, onOpenRecipe, isRemoving = false }: MealPlanAgendaProps) => {
	const itemsByKey = new Map(items.map((item) => [`${item.planned_date.slice(0, 10)}:${item.slot}`, item]));

	return (
		<section className="space-y-3" aria-label="Meal plan agenda">
			{days.map((day) => {
				const plannedSlots = MEAL_SLOTS.filter((slot) => itemsByKey.has(`${day.date}:${slot}`));
				return (
					<article className="min-w-0 rounded-2xl border border-border bg-muted/20 p-4 shadow-sm" key={day.date} aria-labelledby={`agenda-day-${day.date}`}>
						<header className="flex items-start justify-between gap-3 border-b border-border pb-3">
							<div>
								<h3 id={`agenda-day-${day.date}`} className="text-lg font-black">{day.label}</h3>
								<p className="mt-1 text-sm text-muted-foreground">{plannedSlots.length ? `${plannedSlots.length} ${plannedSlots.length === 1 ? "meal" : "meals"} planned` : "No meals planned"}</p>
							</div>
							<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-sm font-black text-secondary-foreground" aria-hidden="true">{day.dayNumber}</span>
						</header>
						{plannedSlots.length ? <div className="mt-3 grid gap-3 sm:grid-cols-2">{plannedSlots.map((slot) => <MealSlotComponent key={`${day.date}-${slot}`} day={day} slot={slot} item={itemsByKey.get(`${day.date}:${slot}`)} onAdd={onAdd} onEdit={onEdit} onRemove={onRemove} onOpenRecipe={onOpenRecipe} isRemoving={isRemoving} />)}</div> : <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/25 p-4 text-center"><p className="text-sm leading-6 text-muted-foreground">Keep this day open or add the first recipe.</p><Button type="button" variant="outline" className="mt-3 w-full sm:w-auto" onClick={() => onAdd(day.date, "dinner")}><Plus className="size-4" />Add a meal</Button></div>}
						{plannedSlots.length ? <Button type="button" variant="ghost" className="mt-3 min-h-11 w-full text-primary hover:bg-accent" onClick={() => onAdd(day.date, "dinner")}><Plus className="size-4" />Add another meal</Button> : null}
					</article>
				);
			})}
		</section>
	);
};

export default MealPlanAgenda;
