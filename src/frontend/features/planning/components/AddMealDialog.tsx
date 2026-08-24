import { useEffect, useState } from "react";
import type { RecipeSummary } from "@/shared/api/contracts";
import {
	MEAL_SLOTS,
	type AddMealPlanItemInput,
	type MealPlanItem,
	type MealSlot,
} from "../api/planningApi";
import RecipePicker from "./RecipePicker";

type AddMealDialogProps = {
	open: boolean;
	initialDate: string;
	initialSlot: MealSlot;
	item?: MealPlanItem | null;
	onClose: () => void;
	onSubmit: (input: AddMealPlanItemInput, itemId?: number) => void;
	isSubmitting: boolean;
	error?: string | null;
};

type SelectedRecipe = Pick<RecipeSummary, "recipe_id" | "recipe_name">;

const slotLabel = (slot: MealSlot) => slot[0].toUpperCase() + slot.slice(1);

const AddMealDialog = ({
	open,
	initialDate,
	initialSlot,
	item,
	onClose,
	onSubmit,
	isSubmitting,
	error,
}: AddMealDialogProps) => {
	const [date, setDate] = useState(initialDate);
	const [slot, setSlot] = useState<MealSlot>(initialSlot);
	const [servings, setServings] = useState(item?.servings ?? 4);
	const [selectedRecipe, setSelectedRecipe] = useState<SelectedRecipe | null>(null);
	const [validationError, setValidationError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) return;
		setDate(item?.planned_date.slice(0, 10) ?? initialDate);
		setSlot(item?.slot ?? initialSlot);
		setServings(item?.servings ?? 4);
		setSelectedRecipe(item ? { recipe_id: item.recipe_id, recipe_name: item.recipe_name } : null);
		setValidationError(null);
	}, [initialDate, initialSlot, item, open]);

	useEffect(() => {
		if (!open) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && !isSubmitting) onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isSubmitting, onClose, open]);

	if (!open) return null;

	const handleSubmit = () => {
		if (!selectedRecipe) {
			setValidationError("Choose a recipe first.");
			return;
		}
		if (!date) {
			setValidationError("Choose a date for this meal.");
			return;
		}
		if (!Number.isInteger(servings) || servings < 1 || servings > 24) {
			setValidationError("Servings must be between 1 and 24.");
			return;
		}

		onSubmit({ recipeId: selectedRecipe.recipe_id, date, slot, servings }, item?.item_id);
	};

	return (
		<div className="planning-dialog-backdrop" role="presentation">
			<section
				className="planning-dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby="planning-dialog-title"
			>
				<header className="planning-dialog__header">
					<div>
						<p className="planning-page__eyebrow">Meal plan</p>
						<h2 id="planning-dialog-title">{item ? "Change planned meal" : "Add a meal to your plan"}</h2>
					</div>
					<button className="planning-dialog__close" type="button" onClick={onClose} disabled={isSubmitting}>
						<span aria-hidden="true">×</span>
						<span className="sr-only">Close meal dialog</span>
					</button>
				</header>

				<div className="planning-dialog__fields">
					<label>
						Date
						<input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
					</label>
					<label>
						Meal
						<select value={slot} onChange={(event) => setSlot(event.target.value as MealSlot)}>
							{MEAL_SLOTS.map((mealSlot) => <option key={mealSlot} value={mealSlot}>{slotLabel(mealSlot)}</option>)}
						</select>
					</label>
					<label>
						Servings
						<input
							type="number"
							inputMode="numeric"
							min="1"
							max="24"
							value={servings}
							onChange={(event) => setServings(Number(event.target.value))}
						/>
					</label>
				</div>

				<RecipePicker
					selectedRecipeId={selectedRecipe?.recipe_id ?? null}
					onSelect={setSelectedRecipe}
					autoFocus
				/>

				{(validationError || error) && <p className="planning-dialog__error" role="alert">{validationError || error}</p>}
				<footer className="planning-dialog__footer">
					<button type="button" className="planning-dialog__secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
					<button type="button" className="planning-dialog__primary" onClick={handleSubmit} disabled={isSubmitting} aria-busy={isSubmitting}>
						{isSubmitting ? "Saving…" : item ? "Save changes" : "Add to plan"}
					</button>
				</footer>
			</section>
		</div>
	);
};

export default AddMealDialog;
