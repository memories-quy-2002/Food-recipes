import { closestCenter, DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useToast } from "@/app/ToastProvider";
import Button from "@/shared/ui/Button";
import { MEAL_SLOTS, type MealPlanItem, type MealSlot } from "../api/planningApi";
import type { PlanningDay } from "../api/planningDates";
import { getMealDropAnnouncement, parseMealItemId, resolveMealDrop, resolveMealDropTarget, type MealDropTarget } from "../planningDnD";
import MealSlotComponent from "./MealSlot";

type MealPlanAgendaProps = {
	days: PlanningDay[];
	items: MealPlanItem[];
	onAdd: (date: string, slot: MealSlot) => void;
	onEdit: (item: MealPlanItem) => void;
	onRemove: (item: MealPlanItem) => void;
	onOpenRecipe?: (item: MealPlanItem) => void;
	onMove?: (item: MealPlanItem, input: MealDropTarget) => void;
	isRemoving?: boolean;
};

const MealPlanAgenda = ({ days, items, onAdd, onEdit, onRemove, onOpenRecipe, onMove, isRemoving = false }: MealPlanAgendaProps) => {
	const [activeId, setActiveId] = useState<number | null>(null);
	const { showToast } = useToast();
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
	const itemsByKey = new Map(items.map((item) => [`${item.planned_date.slice(0, 10)}:${item.slot}`, item]));
	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		const activeItemId = parseMealItemId(active.id);
		const target = resolveMealDropTarget(over?.id, items);
		setActiveId(null);
		if (activeItemId === null || !target) return;
		const result = resolveMealDrop(items, activeItemId, target);
		if (result.status === "occupied") { showToast({ title: "Slot already filled", message: result.message, type: "warning" }); return; }
		if (result.status === "move") {
			const item = items.find((candidate) => candidate.item_id === activeItemId);
			if (item) onMove?.(item, result.input);
		}
	};
	const activeItem = activeId === null ? undefined : items.find((item) => item.item_id === activeId);

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} accessibility={{ announcements: { onDragStart: ({ active }) => { const item = items.find((candidate) => candidate.item_id === parseMealItemId(active.id)); return item ? `${item.recipe_name} picked up. Choose an empty meal slot.` : ""; }, onDragOver: ({ active, over }) => getMealDropAnnouncement(items, active.id, over?.id, "over"), onDragEnd: ({ active, over }) => getMealDropAnnouncement(items, active.id, over?.id, "end"), onDragCancel: () => "Move cancelled." } }} onDragStart={({ active }) => { setActiveId(parseMealItemId(active.id)); }} onDragCancel={() => { setActiveId(null); }} onDragEnd={handleDragEnd}>
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
						<div className="mt-3 grid gap-3 sm:grid-cols-2">{MEAL_SLOTS.map((slot) => <MealSlotComponent key={`${day.date}-${slot}`} day={day} slot={slot} item={itemsByKey.get(`${day.date}:${slot}`)} onAdd={onAdd} onEdit={onEdit} onRemove={onRemove} onOpenRecipe={onOpenRecipe} isRemoving={isRemoving} />)}</div>
						{plannedSlots.length ? <Button type="button" variant="ghost" className="mt-3 min-h-11 w-full text-primary hover:bg-accent" onClick={() => onAdd(day.date, "dinner")}><Plus className="size-4" />Add another meal</Button> : null}
					</article>
				);
			})}
				</section><DragOverlay>{activeItem ? <div className="rounded-xl border border-primary/20 bg-background p-3 font-black shadow-lg">{activeItem.recipe_name}</div> : null}</DragOverlay></DndContext>
	);
};

export default MealPlanAgenda;
