import { useState } from "react";
import { Link } from "react-router-dom";
import PageHelmet from "@/shared/seo/PageHelmet";
import type { AddMealPlanItemInput, MealPlanItem, MealSlot } from "./api/planningApi";
import { getWeekRange, shiftWeek, type WeekRange } from "./api/planningDates";
import {
	useAddMealPlanItemMutation,
	useCreateMealPlanMutation,
	useDeleteMealPlanItemMutation,
	useMealPlanForWeekQuery,
	useUpdateMealPlanItemMutation,
} from "./api/planningQueries";
import AddMealDialog from "./components/AddMealDialog";
import MealPlanGrid from "./components/MealPlanGrid";
import WeekNavigator from "./components/WeekNavigator";
import "./Planning.scss";

type DialogState = {
	date: string;
	slot: MealSlot;
	item?: MealPlanItem;
};

const PlanningPage = () => {
	const [visibleWeek, setVisibleWeek] = useState<WeekRange>(() => getWeekRange(new Date()));
	const [dialogState, setDialogState] = useState<DialogState | null>(null);
	const mealPlanQuery = useMealPlanForWeekQuery(visibleWeek);
	const createPlanMutation = useCreateMealPlanMutation();
	const addMealMutation = useAddMealPlanItemMutation();
	const updateMealMutation = useUpdateMealPlanItemMutation();
	const deleteMealMutation = useDeleteMealPlanItemMutation();
	const activePlan = mealPlanQuery.data?.plan;
	const currentWeek = getWeekRange(new Date());
	const isMealMutationPending = addMealMutation.isPending || updateMealMutation.isPending;
	const mutationError = addMealMutation.error || updateMealMutation.error
		? "We could not save this meal. Try again."
		: null;

	const moveWeek = (offset: number) => {
		setVisibleWeek((currentRange) => shiftWeek(currentRange.from, offset));
	};

	const createPlan = () => {
		createPlanMutation.mutate({
			name: "This week",
			from: visibleWeek.from,
			to: visibleWeek.to,
		});
	};

	const handleMealSubmit = (input: AddMealPlanItemInput, itemId?: number) => {
		if (!activePlan) return;

		if (itemId) {
			updateMealMutation.mutate(
				{ planId: activePlan.plan_id, itemId, input },
				{ onSuccess: () => setDialogState(null) },
			);
			return;
		}

		addMealMutation.mutate(
			{ planId: activePlan.plan_id, input },
			{ onSuccess: () => setDialogState(null) },
		);
	};

	const handleRemoveMeal = (item: MealPlanItem) => {
		if (!activePlan || !window.confirm(`Remove ${item.recipe_name} from your plan?`)) return;
		deleteMealMutation.mutate({ planId: activePlan.plan_id, itemId: item.item_id });
	};

	return (
		<div className="fr-page planning-page">
			<PageHelmet
				title="Planning"
				description="Plan your meals for the week and keep cooking days organized."
				path="/planning"
				noIndex
			/>
			<main className="planning-page__main" aria-labelledby="planning-title">
				<header className="planning-page__header">
					<div className="planning-page__heading">
						<p className="planning-page__eyebrow">Your cooking week</p>
						<h1 id="planning-title">Plan with intention</h1>
						<p>
							Put a recipe on a day, set the servings, and make the week easier to cook.
						</p>
					</div>
					<Link className="planning-page__secondary-link" to="/wishlist">
						Browse saved recipes
					</Link>
				</header>

				<section className="planning-page__week" aria-labelledby="planning-week-title">
					<WeekNavigator
						range={visibleWeek}
						onPrevious={() => moveWeek(-1)}
						onNext={() => moveWeek(1)}
						isCurrentWeek={currentWeek.from === visibleWeek.from}
					/>

					{mealPlanQuery.isPending ? (
						<div className="planning-page__skeleton" role="status" aria-label="Loading your meal plan">
							<div />
							<div />
							<div />
						</div>
					) : mealPlanQuery.isError ? (
						<div className="planning-page__state planning-page__state--error" role="alert">
							<h2>Your plan could not load</h2>
							<p>We could not fetch this week. Try again to keep your plan in sync.</p>
							<button type="button" onClick={() => mealPlanQuery.refetch()}>
								Try again
							</button>
						</div>
					) : mealPlanQuery.data === null ? (
						<div className="planning-page__state planning-page__state--empty">
							<div className="planning-page__state-mark" aria-hidden="true">+</div>
							<h2>Plan your week</h2>
							<p>
								Add recipes to breakfast, lunch, dinner, or snacks and keep your cooking week organized.
							</p>
							<button
								type="button"
								onClick={createPlan}
								disabled={createPlanMutation.isPending}
								aria-busy={createPlanMutation.isPending}
							>
								{createPlanMutation.isPending ? "Creating plan..." : "Start a weekly plan"}
							</button>
							{createPlanMutation.isError && (
								<p className="planning-page__inline-error" role="alert">
									We could not create this plan. Try again.
								</p>
							)}
						</div>
					) : (
						<MealPlanGrid
							days={visibleWeek.days}
							items={mealPlanQuery.data?.items ?? []}
							onAdd={(date, slot) => setDialogState({ date, slot })}
							onEdit={(item) => setDialogState({ date: item.planned_date.slice(0, 10), slot: item.slot, item })}
							onRemove={handleRemoveMeal}
							isRemoving={deleteMealMutation.isPending}
						/>
					)}
				</section>

				<AddMealDialog
					open={Boolean(dialogState)}
					initialDate={dialogState?.date ?? visibleWeek.from}
					initialSlot={dialogState?.slot ?? "dinner"}
					item={dialogState?.item}
					onClose={() => setDialogState(null)}
					onSubmit={handleMealSubmit}
					isSubmitting={isMealMutationPending}
					error={mutationError}
				/>
			</main>
		</div>
	);
};

export default PlanningPage;
