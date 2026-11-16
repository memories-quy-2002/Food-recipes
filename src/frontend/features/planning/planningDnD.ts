import type { KeyboardCoordinateGetter } from "@dnd-kit/core";
import { closestCenter, type CollisionDetection } from "@dnd-kit/core";
import type { MealPlanItem, MealSlot } from "./api/planningApi";

export type MealDropTarget = { date: string; slot: MealSlot };

export type MealDropResult =
	| { status: "move"; input: MealDropTarget }
	| { status: "occupied"; message: "This slot already has a meal."; occupiedItemId: number }
	| { status: "noop" };

export const mealDropTargetId = ({ date, slot }: MealDropTarget) => `meal-slot:${date}:${slot}`;
export const mealItemId = (itemId: number) => `meal-item:${itemId}`;

export const mealSlotCollisionDetection: CollisionDetection = (args) => closestCenter({
	...args,
	droppableContainers: args.droppableContainers.filter((container) => parseMealDropTargetId(String(container.id)) !== null),
});

export const mealPlanKeyboardCoordinates: KeyboardCoordinateGetter = (event, { currentCoordinates, context }) => {
	const axis = event.code === "ArrowUp" || event.code === "ArrowDown" ? "y" : event.code === "ArrowLeft" || event.code === "ArrowRight" ? "x" : null;
	if (!axis || !context.collisionRect) return;
	const direction = event.code === "ArrowDown" || event.code === "ArrowRight" ? 1 : -1;
	const activeRect = context.collisionRect;
	const activeCenter = {
		x: activeRect.left + activeRect.width / 2,
		y: activeRect.top + activeRect.height / 2,
	};

	const candidates = context.droppableContainers.getEnabled().flatMap((container) => {
		if (!parseMealDropTargetId(String(container.id))) return [];
		if (container.id === context.over?.id) return [];
		const rect = context.droppableRects.get(container.id);
		if (!rect) return [];
		const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
		const primaryDelta = (center[axis] - activeCenter[axis]) * direction;
		if (primaryDelta <= 1) return [];
		const crossAxis: "x" | "y" = axis === "x" ? "y" : "x";
		return [{ rect, primaryDelta, crossAxisDelta: Math.abs(center[crossAxis] - activeCenter[crossAxis]) }];
	});

	const target = candidates.sort((a, b) => a.primaryDelta - b.primaryDelta || a.crossAxisDelta - b.crossAxisDelta)[0];
	if (!target) return;
	const targetCenter = {
		x: target.rect.left + target.rect.width / 2,
		y: target.rect.top + target.rect.height / 2,
	};
	const nextCoordinates = {
		x: currentCoordinates.x + targetCenter.x - activeCenter.x,
		y: currentCoordinates.y + targetCenter.y - activeCenter.y,
	};
	return nextCoordinates;
};

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
