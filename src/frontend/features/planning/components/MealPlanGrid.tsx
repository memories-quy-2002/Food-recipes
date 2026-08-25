import { closestCenter, DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import { useToast } from "@/app/ToastProvider";
import { MEAL_SLOTS, type MealPlanItem, type MealSlot } from "../api/planningApi";
import type { PlanningDay } from "../api/planningDates";
import { getMealDropAnnouncement, parseMealItemId, resolveMealDrop, resolveMealDropTarget, type MealDropTarget } from "../planningDnD";
import MealSlotComponent from "./MealSlot";

type MealPlanGridProps = { days: PlanningDay[]; items: MealPlanItem[]; onAdd: (date: string, slot: MealSlot) => void; onEdit: (item: MealPlanItem) => void; onRemove: (item: MealPlanItem) => void; onOpenRecipe?: (item: MealPlanItem) => void; onMove?: (item: MealPlanItem, input: MealDropTarget) => void; isRemoving?: boolean };
const MealPlanGrid = ({ days, items, onAdd, onEdit, onRemove, onOpenRecipe, onMove, isRemoving = false }: MealPlanGridProps) => {
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
	return <DndContext sensors={sensors} collisionDetection={closestCenter} accessibility={{ announcements: { onDragStart: ({ active }) => { const item = items.find((candidate) => candidate.item_id === parseMealItemId(active.id)); return item ? `${item.recipe_name} picked up. Choose an empty meal slot.` : ""; }, onDragOver: ({ active, over }) => getMealDropAnnouncement(items, active.id, over?.id, "over"), onDragEnd: ({ active, over }) => getMealDropAnnouncement(items, active.id, over?.id, "end"), onDragCancel: () => "Move cancelled." } }} onDragStart={({ active }) => { setActiveId(parseMealItemId(active.id)); }} onDragCancel={() => { setActiveId(null); }} onDragEnd={handleDragEnd}><section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7" aria-label="Weekly meal plan">{days.map((day) => <section className="min-w-0 rounded-2xl border border-border bg-muted/20 p-3 shadow-sm" key={day.date} aria-labelledby={`planning-day-${day.date}`}><header className="mb-3 border-b border-border pb-3"><h3 id={`planning-day-${day.date}`} className="text-lg font-black">{day.label.split(",")[0]}</h3><span className="text-sm text-muted-foreground">{day.label.split(", ")[1]}</span></header><div className="grid gap-3">{MEAL_SLOTS.map((slot) => <MealSlotComponent key={`${day.date}-${slot}`} day={day} slot={slot} item={itemsByKey.get(`${day.date}:${slot}`)} onAdd={onAdd} onEdit={onEdit} onRemove={onRemove} onOpenRecipe={onOpenRecipe} isRemoving={isRemoving} />)}</div></section>)}</section><DragOverlay>{activeItem ? <div className="rounded-xl border border-primary/20 bg-background p-3 font-black shadow-lg">{activeItem.recipe_name}</div> : null}</DragOverlay></DndContext>;
};
export default MealPlanGrid;
