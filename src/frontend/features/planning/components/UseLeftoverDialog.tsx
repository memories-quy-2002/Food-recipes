import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import { useLeftoversQuery } from "@/features/leftovers/api/leftoversQueries";
import type { KitchenScope } from "@/features/households/householdScope";
import { MEAL_SLOTS, type MealPlan, type MealSlot } from "../api/planningApi";
import { useAddLeftoverMealPlanItemMutation, useCreateMealPlanMutation } from "../api/planningQueries";
import { getWeekRange } from "../api/planningDates";

type UseLeftoverDialogProps = {
	open: boolean;
	initialDate: string;
	scope: KitchenScope;
	activePlan?: Pick<MealPlan, "plan_id">;
	onClose: () => void;
};

const slotLabel = (slot: MealSlot): string => slot[0].toUpperCase() + slot.slice(1);

const UseLeftoverDialog = ({ open, initialDate, scope, activePlan, onClose }: UseLeftoverDialogProps) => {
	const leftoversQuery = useLeftoversQuery(scope, { enabled: open });
	const addMutation = useAddLeftoverMealPlanItemMutation(scope);
	const createMutation = useCreateMealPlanMutation(scope);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [date, setDate] = useState(initialDate);
	const [slot, setSlot] = useState<MealSlot>("lunch");
	const [servings, setServings] = useState(1);
	const [error, setError] = useState<string | null>(null);

	const selectedLeftover = leftoversQuery.data?.items.find((item) => item.leftover_id === selectedId);

	useEffect(() => {
		if (!open) return;
		setSelectedId(null);
		setDate(initialDate);
		setSlot("lunch");
		setServings(1);
		setError(null);
	}, [initialDate, open]);

	const selectLeftover = (leftoverId: number): void => {
		const leftover = leftoversQuery.data?.items.find((item) => item.leftover_id === leftoverId);
		if (!leftover) return;
		setSelectedId(leftoverId);
		setServings(Math.min(leftover.remaining_servings, 24));
	};

	const addToPlan = (planId: number): void => {
		if (!selectedLeftover) return;
		addMutation.mutate(
			{ planId, input: { leftoverBatchId: selectedLeftover.leftover_id, date, slot, servings } },
			{ onSuccess: onClose, onError: () => setError("This leftover could not be added. It may have expired or already been planned.") },
		);
	};

	const handleSubmit = (): void => {
		if (!selectedLeftover) return setError("Choose a leftover first.");
		if (!date || !Number.isInteger(servings) || servings < 1 || servings > Math.min(selectedLeftover.remaining_servings, 24)) return setError("Choose a valid portion amount.");
		const expiryDate = selectedLeftover.expires_at?.slice(0, 10);
		if (expiryDate && date > expiryDate) return setError("Choose a date on or before the leftover expiry date.");
		setError(null);
		if (activePlan) {
			addToPlan(activePlan.plan_id);
			return;
		}
		createMutation.mutate(
			(() => { const week = getWeekRange(new Date(`${date}T00:00:00`)); return { name: "This week", from: week.from, to: week.to }; })(),
			{ onSuccess: (response) => response?.plan?.plan_id ? addToPlan(response.plan.plan_id) : setError("Your plan was created, but the leftover could not be added."), onError: () => setError("We could not create your plan. Try again.") },
		);
	};

	if (!open) return null;
	const isSubmitting = addMutation.isPending || createMutation.isPending;

	return (
		<div className="fixed inset-0 z-50 grid place-items-end bg-black/45 p-0 sm:place-items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSubmitting) onClose(); }}>
			<section className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="leftover-planning-dialog-title">
				<header className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Meal plan</p><h2 id="leftover-planning-dialog-title" className="mt-1 text-2xl font-black">Use leftovers</h2></div><Button variant="ghost" size="icon" onClick={onClose} disabled={isSubmitting} aria-label="Close leftover planning dialog"><X className="size-5" /></Button></header>
				<p className="mt-3 text-sm leading-6 text-muted-foreground">Choose a batch and reserve portions for a meal. Recipe ingredients will not be deducted.</p>
				{leftoversQuery.isPending ? <p className="mt-5 rounded-xl bg-muted p-4 text-sm" role="status">Finding available leftovers…</p> : leftoversQuery.isError ? <p className="mt-5 rounded-xl bg-destructive/10 p-4 text-sm font-semibold text-destructive" role="alert">Leftovers could not load. Try again.</p> : leftoversQuery.data?.items.length ? <div className="mt-5 grid gap-2" role="listbox" aria-label="Available leftovers">{leftoversQuery.data.items.map((leftover) => <button key={leftover.leftover_id} type="button" role="option" aria-selected={selectedId === leftover.leftover_id} className={`flex min-h-16 items-center justify-between gap-3 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedId === leftover.leftover_id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`} onClick={() => selectLeftover(leftover.leftover_id)}><span><span className="block font-black">{leftover.recipe_name}</span><span className="mt-1 block text-sm text-muted-foreground">{leftover.remaining_servings} servings available</span></span><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-black text-secondary-foreground">Leftover</span></button>)}</div> : <p className="mt-5 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">No available leftovers yet. Save extra portions after cooking a recipe.</p>}
				<div className="mt-5 grid gap-3 sm:grid-cols-3"><label className="grid gap-2 text-sm font-bold">Date<Input type="date" value={date} max={selectedLeftover?.expires_at?.slice(0, 10)} onChange={(event) => setDate(event.target.value)} disabled={isSubmitting} /></label><label className="grid gap-2 text-sm font-bold">Meal<select aria-label="Meal" className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm" value={slot} onChange={(event) => setSlot(event.target.value as MealSlot)} disabled={isSubmitting}>{MEAL_SLOTS.map((mealSlot) => <option key={mealSlot} value={mealSlot}>{slotLabel(mealSlot)}</option>)}</select></label><label className="grid gap-2 text-sm font-bold">Servings<Input type="number" min="1" max={selectedLeftover ? Math.min(selectedLeftover.remaining_servings, 24) : 24} value={servings} onChange={(event) => setServings(Number(event.target.value))} disabled={isSubmitting || !selectedLeftover} /></label></div>
				{error && <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive" role="alert">{error}</p>}
				<footer className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5"><Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button><Button onClick={handleSubmit} disabled={isSubmitting} aria-busy={isSubmitting}>{isSubmitting ? "Adding…" : "Add leftover to plan"}</Button></footer>
			</section>
		</div>
	);
};

export default UseLeftoverDialog;
