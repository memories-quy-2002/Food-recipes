import { useEffect, useMemo, useState } from "react";
import { MEAL_SLOTS, type MealSlot } from "../api/planningApi";
import {
	useAddMealPlanItemMutation,
	useCreateMealPlanMutation,
	useMealPlanForWeekQuery,
} from "../api/planningQueries";
import { getWeekRange, toIsoDate } from "../api/planningDates";

type RecipeForPlan = {
	recipe_id: number;
	recipe_name: string;
};

type AddToPlanDialogProps = {
	open: boolean;
	recipe?: RecipeForPlan | null;
	onClose: () => void;
	onAdded: () => void;
};

const slotLabel = (slot: MealSlot) => slot[0].toUpperCase() + slot.slice(1);

const AddToPlanDialog = ({ open, recipe, onClose, onAdded }: AddToPlanDialogProps) => {
	const [date, setDate] = useState(() => toIsoDate(new Date()));
	const [slot, setSlot] = useState<MealSlot>("dinner");
	const [servings, setServings] = useState(4);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const selectedWeek = useMemo(() => {
		const parsedDate = new Date(`${date}T00:00:00`);
		return Number.isNaN(parsedDate.getTime()) ? getWeekRange(new Date()) : getWeekRange(parsedDate);
	}, [date]);
	const weekQuery = useMealPlanForWeekQuery(selectedWeek, { enabled: open, selectedDate: date });
	const createPlanMutation = useCreateMealPlanMutation();
	const addMealMutation = useAddMealPlanItemMutation();
	const isSubmitting = createPlanMutation.isPending || addMealMutation.isPending;
	const isCheckingPlan = weekQuery.isPending || weekQuery.isFetching;

	useEffect(() => {
		if (!open) return;
		setDate(toIsoDate(new Date()));
		setSlot("dinner");
		setServings(4);
		setValidationError(null);
		setActionError(null);
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && !isSubmitting) onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isSubmitting, onClose, open]);

	if (!open) return null;

	const handleAddToPlan = () => {
		if (!recipe) {
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
		if (isCheckingPlan) return;

		setValidationError(null);
		setActionError(null);
		const input = { recipeId: recipe.recipe_id, date, slot, servings };
		const addToPlan = (planId: number) => {
			addMealMutation.mutate(
				{ planId, input },
				{
					onSuccess: onAdded,
					onError: () => setActionError("We could not add this recipe to your plan. Try again."),
				},
			);
		};

		if (weekQuery.data?.plan) {
			addToPlan(weekQuery.data.plan.plan_id);
			return;
		}

		createPlanMutation.mutate(
			{ name: "This week", from: selectedWeek.from, to: selectedWeek.to },
			{
				onSuccess: (response) => {
					if (!response?.plan?.plan_id) {
						setActionError("Your plan was created, but the recipe could not be added. Try again.");
						return;
					}
					addToPlan(response.plan.plan_id);
				},
				onError: () => setActionError("We could not create this plan. Try again."),
			},
		);
	};

	const queryError = weekQuery.isError
		? "We could not load plan details. Try again before adding this recipe."
		: null;
	const errorMessage = validationError || actionError || queryError;

	return (
		<div className="planning-dialog-backdrop" role="presentation">
			<section className="planning-dialog planning-dialog--recipe" role="dialog" aria-modal="true" aria-labelledby="add-to-plan-dialog-title">
				<header className="planning-dialog__header">
					<div>
						<p className="planning-page__eyebrow">Meal plan</p>
						<h2 id="add-to-plan-dialog-title">Add {recipe?.recipe_name || "recipe"} to your plan</h2>
					</div>
					<button className="planning-dialog__close" type="button" onClick={onClose} disabled={isSubmitting} aria-label="Close add to plan dialog">
						<span aria-hidden="true">×</span>
					</button>
				</header>

				<p className="planning-dialog__recipe-context">
					Choose when you want to cook it. You can change the meal later from Planning.
				</p>

				<div className="planning-dialog__fields">
					<label htmlFor="add-to-plan-date">
						Date
						<input id="add-to-plan-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={isSubmitting} autoFocus />
					</label>
					<label htmlFor="add-to-plan-meal">
						Meal
						<select id="add-to-plan-meal" value={slot} onChange={(event) => setSlot(event.target.value as MealSlot)} disabled={isSubmitting}>
							{MEAL_SLOTS.map((mealSlot) => <option key={mealSlot} value={mealSlot}>{slotLabel(mealSlot)}</option>)}
						</select>
					</label>
					<label htmlFor="add-to-plan-servings">
						Servings
						<input id="add-to-plan-servings" type="number" inputMode="numeric" min="1" max="24" value={servings} onChange={(event) => setServings(Number(event.target.value))} disabled={isSubmitting} />
					</label>
				</div>

				{isCheckingPlan && <p className="planning-dialog__hint" role="status">Checking your plan...</p>}
				{queryError && (
					<div className="planning-dialog__error-state" role="alert">
						<p>{queryError}</p>
						<button type="button" className="planning-dialog__secondary" onClick={() => weekQuery.refetch()}>Try again</button>
					</div>
				)}
				{!isCheckingPlan && !weekQuery.isError && !weekQuery.data?.plan && <p className="planning-dialog__hint">No plan covers this week yet. We will create one when you add this recipe.</p>}
				{errorMessage && !queryError && <p className="planning-dialog__error" role="alert">{errorMessage}</p>}

				<footer className="planning-dialog__footer">
					<button type="button" className="planning-dialog__secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
					<button type="button" className="planning-dialog__primary" onClick={handleAddToPlan} disabled={isSubmitting || isCheckingPlan || weekQuery.isError} aria-busy={isSubmitting}>
						{isSubmitting ? "Adding to plan..." : "Add to plan"}
					</button>
				</footer>
			</section>
		</div>
	);
};

export default AddToPlanDialog;
