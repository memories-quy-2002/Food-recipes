import type { MealPlanItem, MealSlot } from "./api/planningApi";

export type MealDropTarget = { date: string; slot: MealSlot };

export type MealDropResult =
	| { status: "move"; input: MealDropTarget }
	| { status: "occupied"; message: "This slot already has a meal."; occupiedItemId: number }
	| { status: "noop" };

export const mealDropTargetId = ({ date, slot }: MealDropTarget) => `meal-slot:${date}:${slot}`;
export const mealItemId = (itemId: number) => `meal-item:${itemId}`;

export const parseMealDropTargetId = (id: string): MealDropTarget | null => {
	const [, date, slot] = id.split(":");
	return date && (slot === "breakfast" || slot === "lunch" || slot === "dinner" || slot === "snack")
		? { date, slot }
		: null;
};

export const parseMealItemId = (id: string | number): number | null => {
	if (typeof id === "number") return id;
	if (!id.startsWith("meal-item:")) return null;
	const itemId = Number(id.slice("meal-item:".length));
	return Number.isInteger(itemId) ? itemId : null;
};

export const resolveMealDropTarget = (id: string | number | null | undefined, items: MealPlanItem[]): MealDropTarget | null => {
	if (id === null || id === undefined) return null;
	const directTarget = parseMealDropTargetId(String(id));
	if (directTarget) return directTarget;
	const itemId = parseMealItemId(id);
	const item = itemId === null ? undefined : items.find((candidate) => candidate.item_id === itemId);
	return item ? { date: item.planned_date.slice(0, 10), slot: item.slot } : null;
};

export const getMealDropAnnouncement = (
	items: MealPlanItem[],
	activeId: string | number,
	overId: string | number | null | undefined,
	phase: "over" | "end",
) => {
	const activeItemId = parseMealItemId(activeId);
	const target = resolveMealDropTarget(overId, items);
	if (activeItemId === null || !target) return phase === "end" ? "Move cancelled. Choose a meal slot." : "No valid meal slot.";
	const result = resolveMealDrop(items, activeItemId, target);
	if (result.status === "occupied") return result.message;
	if (phase === "over") return `${target.date} ${target.slot} slot.`;
	return result.status === "noop" ? "Meal stayed in its current slot." : "Meal moved to an empty slot.";
};

export const resolveMealDrop = (
	items: MealPlanItem[],
	activeItemId: number,
	target: MealDropTarget,
): MealDropResult => {
	const activeItem = items.find((item) => item.item_id === activeItemId);
	if (!activeItem) return { status: "noop" };

	if (activeItem.planned_date.slice(0, 10) === target.date && activeItem.slot === target.slot) {
		return { status: "noop" };
	}

	const occupiedItem = items.find(
		(item) => item.item_id !== activeItemId && item.planned_date.slice(0, 10) === target.date && item.slot === target.slot,
	);
	if (occupiedItem) {
		return {
			status: "occupied",
			message: "This slot already has a meal.",
			occupiedItemId: occupiedItem.item_id,
		};
	}

	return { status: "move", input: target };
};
