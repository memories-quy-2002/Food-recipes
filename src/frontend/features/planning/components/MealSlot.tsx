import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Link } from "react-router-dom";
import { CheckCircle2, Cookie, GripVertical, Moon, Pencil, Play, Plus, Sun, Sunrise, Trash2, type LucideIcon } from "lucide-react";
import Button from "@/shared/ui/Button";
import type { MealPlanItem, MealSlot as MealSlotName } from "../api/planningApi";
import type { PlanningDay } from "../api/planningDates";
import { mealDropTargetId, mealItemId } from "../planningDnD";
import { PERSONAL_KITCHEN, type KitchenScope } from "@/features/households/householdScope";
import { useHouseholdScope } from "@/features/households/HouseholdScopeProvider";

type MealSlotProps = {
	day: PlanningDay;
	slot: MealSlotName;
	item?: MealPlanItem;
	onAdd: (date: string, slot: MealSlotName) => void;
	onEdit: (item: MealPlanItem) => void;
	onRemove: (item: MealPlanItem) => void;
	onOpenRecipe?: (item: MealPlanItem) => void;
	isRemoving?: boolean;
	readOnly?: boolean;
};

const SLOT_META: Record<MealSlotName, { shortLabel: string; Icon: LucideIcon }> = {
	breakfast: { shortLabel: "B", Icon: Sunrise },
	lunch: { shortLabel: "L", Icon: Sun },
	dinner: { shortLabel: "D", Icon: Moon },
	snack: { shortLabel: "S", Icon: Cookie },
};

const slotLabel = (slot: MealSlotName) => slot[0].toUpperCase() + slot.slice(1);
const fullWeekday = (day: PlanningDay) => day.label.split(",")[0];

export const buildMealCookingHref = (item: MealPlanItem, scope: KitchenScope = PERSONAL_KITCHEN): string => {
	const params = new URLSearchParams({
		id: String(item.recipe_id),
		planItemId: String(item.item_id),
		date: item.planned_date.slice(0, 10),
		slot: item.slot,
		servings: String(item.servings),
		returnTo: "/planning",
	});
	if (item.source_type === "leftover") {
		params.set("sourceType", "leftover");
		if (item.leftover_batch_id != null) params.set("leftoverBatchId", String(item.leftover_batch_id));
	}
	if (scope.kind === "household") params.set("householdId", String(scope.householdId));
	return `/recipe/cooking?${params.toString()}`;
};

const statusMeta = {
	planned: { label: "Planned", className: "bg-muted text-muted-foreground" },
	cooking: { label: "Cooking", className: "bg-primary/10 text-primary" },
	completed: { label: "Completed", className: "bg-secondary text-secondary-foreground" },
} as const;

const SlotBadge = ({ slot }: { slot: MealSlotName }) => {
	const { shortLabel, Icon } = SLOT_META[slot];

	return (
		<span
			className="inline-flex items-center gap-1 text-[0.68rem] font-black uppercase tracking-[0.14em] text-muted-foreground"
			title={slotLabel(slot)}
		>
			<GripVertical className="size-3 text-muted-foreground/60" aria-hidden="true" />
			<Icon className="size-3.5 text-primary" aria-hidden="true" />
			<span aria-hidden="true">{shortLabel}</span>
			<span className="sr-only">{slotLabel(slot)}</span>
		</span>
	);
};

const MealSlot = ({ day, slot, item, onAdd, onEdit, onRemove, onOpenRecipe, isRemoving = false, readOnly = false }: MealSlotProps) => {
	const { scope } = useHouseholdScope();
	const targetId = mealDropTargetId({ date: day.date, slot });
	const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({ id: targetId });
	const { attributes, listeners, setNodeRef: setDraggableNodeRef, isDragging } = useDraggable({
		id: item ? mealItemId(item.item_id) : targetId,
		disabled: !item || readOnly,
	});
	const style = { opacity: isDragging ? 0.45 : undefined };
	const addLabel = `Add recipe to ${fullWeekday(day)} ${slot}`;
	const cookingStatus = item?.cooking_status ?? "planned";
	const status = statusMeta[cookingStatus];

	if (!item) {
		return (
			<div
				ref={setDroppableNodeRef}
				className={`min-w-0 rounded-lg border border-dashed border-border/70 bg-background/35 p-2.5 transition ${isOver ? "ring-2 ring-primary" : "hover:border-primary/45"}`}
			>
				<div className="flex items-center justify-between gap-2">
					<SlotBadge slot={slot} />
					{!readOnly && <button
						type="button"
						className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-primary transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						onClick={() => onAdd(day.date, slot)}
						aria-label={addLabel}
						title={addLabel}
					>
						<Plus className="size-4" aria-hidden="true" />
					</button>}
				</div>
			</div>
		);
	}

	const dragAttributes = { ...attributes, role: undefined };
	const stopDragStart = (event: { stopPropagation: () => void }) => event.stopPropagation();

	return (
		<div ref={setDroppableNodeRef} className={`min-w-0 rounded-lg ${isOver ? "ring-2 ring-primary" : ""}`}>
			<article
				ref={setDraggableNodeRef}
				{...dragAttributes}
				{...listeners}
				role="group"
				tabIndex={0}
				aria-label={`Drag ${item.recipe_name} to another empty meal slot`}
				aria-roledescription="draggable meal"
				data-testid={`draggable-meal-${item.item_id}`}
				style={style}
				className="touch-manipulation cursor-grab rounded-lg border border-primary/15 bg-secondary/55 p-2.5 shadow-sm transition active:cursor-grabbing hover:border-primary/35 hover:shadow-md"
			>
				<div className="flex items-center justify-between gap-2">
					<SlotBadge slot={slot} />
					<div className="flex items-center gap-2">
						{item.source_type === "leftover" && <span className="inline-flex min-h-7 items-center rounded-full bg-amber-100 px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.1em] text-amber-900">Leftover</span>}
						<span className={`inline-flex min-h-7 items-center gap-1 rounded-full px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.1em] ${status.className}`}><CheckCircle2 className="size-3" aria-hidden="true" />{status.label}</span>
						<span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground" title={`${item.servings} servings`}>
						<span aria-hidden="true">{item.servings}×</span>
						<span className="sr-only">{item.servings} servings</span>
						</span>
					</div>
				</div>

				<Link
					className="mt-2 flex min-h-11 items-center line-clamp-2 font-black leading-snug text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					to={`/recipe?id=${item.recipe_id}`}
					aria-label={`Open ${item.recipe_name}`}
					onClick={() => onOpenRecipe?.(item)}
					onPointerDown={stopDragStart}
					onKeyDown={stopDragStart}
				>
					{item.recipe_name}
				</Link>

				<div className="mt-2 flex items-center justify-between gap-2">
					<Link
						className="inline-flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						to={buildMealCookingHref(item, scope)}
						aria-label={`${cookingStatus === "cooking" ? "Continue cooking" : cookingStatus === "completed" ? "Cook again" : "Start cooking"} ${item.recipe_name}`}
						title={`${cookingStatus === "cooking" ? "Continue cooking" : cookingStatus === "completed" ? "Cook again" : "Start cooking"} ${item.recipe_name}`}
						onPointerDown={stopDragStart}
						onKeyDown={stopDragStart}
					>
						<Play className="size-4 fill-current" aria-hidden="true" />
						<span className="sr-only">{cookingStatus === "cooking" ? "Continue cooking" : cookingStatus === "completed" ? "Cook again" : "Start cooking"}</span>
					</Link>
					<div className="flex items-center gap-1">
						{!readOnly && <Button
							variant="ghost"
							size="icon"
							className="size-11"
							onClick={() => onEdit(item)}
							onPointerDown={stopDragStart}
							onKeyDown={stopDragStart}
							aria-label={`Change ${item.recipe_name}`}
							title={`Change ${item.recipe_name}`}
						>
							<Pencil className="size-4" aria-hidden="true" />
						</Button>}
						{!readOnly && <Button
							variant="ghost"
							size="icon"
							className="size-11 text-destructive hover:bg-destructive/10 hover:text-destructive"
							onClick={() => onRemove(item)}
							onPointerDown={stopDragStart}
							onKeyDown={stopDragStart}
							aria-label={`Remove ${item.recipe_name} from ${slot}`}
							title={`Remove ${item.recipe_name} from ${slot}`}
							disabled={isRemoving}
							aria-busy={isRemoving}
						>
							<Trash2 className="size-4" aria-hidden="true" />
						</Button>}
					</div>
				</div>
			</article>
		</div>
	);
};

export default MealSlot;
