import { Link } from "react-router-dom";
import type { MealPlanItem, MealSlot as MealSlotName } from "../api/planningApi";
import type { PlanningDay } from "../api/planningDates";

type MealSlotProps = {
	day: PlanningDay;
	slot: MealSlotName;
	item?: MealPlanItem;
	onAdd: (date: string, slot: MealSlotName) => void;
	onEdit: (item: MealPlanItem) => void;
	onRemove: (item: MealPlanItem) => void;
	onOpenRecipe?: (item: MealPlanItem) => void;
	isRemoving?: boolean;
};

	const slotLabel = (slot: MealSlotName) => slot[0].toUpperCase() + slot.slice(1);
const fullWeekday = (day: PlanningDay) => day.label.split(",")[0];

const MealSlot = ({
	day,
	slot,
	item,
	onAdd,
	onEdit,
	onRemove,
	onOpenRecipe,
	isRemoving = false,
}: MealSlotProps) => {
	if (!item) {
		return (
			<div className="planning-meal-slot planning-meal-slot--empty">
				<span className="planning-meal-slot__label">{slotLabel(slot)}</span>
				<button
					type="button"
					className="planning-meal-slot__add"
					onClick={() => onAdd(day.date, slot)}
				>
					<span aria-hidden="true">+</span>
					<span>Add recipe to {fullWeekday(day)} {slot}</span>
				</button>
			</div>
		);
	}

	return (
		<article className="planning-meal-slot planning-meal-slot--filled">
			<div className="planning-meal-slot__header">
				<span className="planning-meal-slot__label">{slotLabel(slot)}</span>
				<span className="planning-meal-slot__servings">{item.servings} servings</span>
			</div>
			<Link
				className="planning-meal-slot__recipe"
				to={`/recipe?id=${item.recipe_id}`}
				aria-label={`Open ${item.recipe_name}`}
				onClick={() => onOpenRecipe?.(item)}
			>
				{item.recipe_name}
			</Link>
			<Link
				className="planning-meal-slot__cook"
				to={`/recipe/cooking?id=${item.recipe_id}&planItemId=${item.item_id}&date=${encodeURIComponent(item.planned_date.slice(0, 10))}&slot=${item.slot}&servings=${item.servings}&returnTo=%2Fplanning`}
				aria-label={`Start cooking ${item.recipe_name}`}
			>
				Start cooking
			</Link>
			<div className="planning-meal-slot__actions">
				<button type="button" onClick={() => onEdit(item)} aria-label={`Change ${item.recipe_name}`}>
					Change
				</button>
				<button
					type="button"
					className="planning-meal-slot__remove"
					onClick={() => onRemove(item)}
					aria-label={`Remove ${item.recipe_name} from ${slot}`}
					disabled={isRemoving}
					aria-busy={isRemoving}
				>
					{isRemoving ? "Removing..." : "Remove"}
				</button>
			</div>
		</article>
	);
};

export default MealSlot;
