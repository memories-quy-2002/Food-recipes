import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import { MEAL_SLOTS, type MealSlot } from "@/features/planning/api/planningApi";

export type LeftoverSaveInput = {
	remainingServings: number;
	expiresAt: string;
	planDate?: string;
	slot?: MealSlot;
	planServings?: number;
};

type LeftoverCompletionDialogProps = {
	open: boolean;
	recipeName: string;
	cookedServings: number;
	onClose: () => void;
	onSave: (input: LeftoverSaveInput) => Promise<void>;
};

const toIsoDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const addDays = (days: number): string => {
	const date = new Date();
	date.setDate(date.getDate() + days);
	return toIsoDate(date);
};

const slotLabel = (slot: MealSlot): string => slot[0].toUpperCase() + slot.slice(1);

const LeftoverCompletionDialog = ({ open, recipeName, cookedServings, onClose, onSave }: LeftoverCompletionDialogProps) => {
	const [amountMode, setAmountMode] = useState<"remaining" | "eaten">("remaining");
	const [amount, setAmount] = useState(cookedServings);
	const [expiresAt, setExpiresAt] = useState(() => addDays(3));
	const [addToPlan, setAddToPlan] = useState(false);
	const [planDate, setPlanDate] = useState(() => addDays(1));
	const [slot, setSlot] = useState<MealSlot>("lunch");
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const dialogRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (!open) return;
		setAmountMode("remaining");
		setAmount(cookedServings);
		setExpiresAt(addDays(3));
		setAddToPlan(false);
		setPlanDate(addDays(1));
		setSlot("lunch");
		setError(null);
		window.setTimeout(() => dialogRef.current?.querySelector<HTMLElement>("button, input")?.focus(), 0);
	}, [cookedServings, open]);

	useEffect(() => {
		if (!open) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && !isSaving) onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isSaving, onClose, open]);

	if (!open) return null;
	const remainingServings = amountMode === "eaten" ? cookedServings - amount : amount;
	const isValidAmount = Number.isInteger(amount) && amount >= 0 && amount <= cookedServings && remainingServings > 0;
	const isValidPlanDate = !addToPlan || (Boolean(planDate) && planDate <= expiresAt);

	const handleSave = async () => {
		if (!expiresAt || !isValidAmount || !isValidPlanDate) {
			setError("Enter a positive leftover amount within the cooked servings.");
			return;
		}
		setError(null);
		setIsSaving(true);
		try {
			await onSave({
				remainingServings,
				expiresAt: `${expiresAt}T23:59:59.000Z`,
				...(addToPlan ? { planDate, slot, planServings: remainingServings } : {}),
			});
		} catch {
			setError("We could not save this leftover. Try again.");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[60] grid place-items-end bg-black/45 p-0 sm:place-items-center sm:p-4" role="presentation">
			<section ref={dialogRef} className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="leftover-dialog-title" aria-describedby="leftover-dialog-description">
				<header className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Save the extra</p>
						<h2 id="leftover-dialog-title" className="mt-1 text-2xl font-black">Save {recipeName} leftovers</h2>
					</div>
					<Button variant="ghost" size="icon" onClick={onClose} disabled={isSaving} aria-label="Close leftover dialog"><X className="size-5" /></Button>
				</header>
				<p id="leftover-dialog-description" className="mt-3 text-sm leading-6 text-muted-foreground">Keep the portions you will actually eat later. You can use them from Planning.</p>

				<div className="mt-5 grid gap-3 sm:grid-cols-2">
					<label className="grid gap-2 text-sm font-bold">Cooked servings<Input aria-label="Cooked servings" type="number" value={cookedServings} readOnly /></label>
					<label className="grid gap-2 text-sm font-bold">Expires on<Input aria-label="Expires on" type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} disabled={isSaving} /></label>
				</div>

				<fieldset className="mt-5 grid gap-3">
					<legend className="text-sm font-black">Portions to save</legend>
					<label className="flex items-center gap-3 text-sm font-semibold"><input type="radio" name="leftover-amount-mode" checked={amountMode === "remaining"} onChange={() => { setAmountMode("remaining"); setAmount(cookedServings); }} />Enter remaining servings</label>
					<label className="flex items-center gap-3 text-sm font-semibold"><input type="radio" aria-label="Eaten servings" name="leftover-amount-mode" checked={amountMode === "eaten"} onChange={() => { setAmountMode("eaten"); setAmount(0); }} />Enter eaten servings</label>
					<label className="grid gap-2 text-sm font-bold">{amountMode === "eaten" ? "Eaten servings amount" : "Remaining servings amount"}<Input aria-label={amountMode === "eaten" ? "Eaten servings amount" : "Remaining servings amount"} type="number" min="0" max={cookedServings} value={amount} onChange={(event) => setAmount(Number(event.target.value))} disabled={isSaving} /></label>
					<p className="text-sm text-muted-foreground" aria-live="polite">{remainingServings > 0 ? `${remainingServings} servings will be saved.` : "Nothing will be saved."}</p>
				</fieldset>

				<label className="mt-5 flex items-center gap-3 text-sm font-bold"><input type="checkbox" aria-label="Add to tomorrow's lunch" checked={addToPlan} onChange={(event) => setAddToPlan(event.target.checked)} disabled={isSaving} />Add to tomorrow&apos;s lunch</label>
				{addToPlan && <div className="mt-3 grid gap-3 rounded-2xl bg-muted/45 p-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Plan date<Input type="date" value={planDate} max={expiresAt} onChange={(event) => setPlanDate(event.target.value)} disabled={isSaving} /></label><label className="grid gap-2 text-sm font-bold">Meal<select aria-label="Meal" className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm" value={slot} onChange={(event) => setSlot(event.target.value as MealSlot)} disabled={isSaving}>{MEAL_SLOTS.map((mealSlot) => <option key={mealSlot} value={mealSlot}>{slotLabel(mealSlot)}</option>)}</select></label></div>}
				{error && <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive" role="alert">{error}</p>}
				<footer className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5"><Button variant="outline" onClick={onClose} disabled={isSaving}>Skip</Button><Button onClick={() => void handleSave()} disabled={isSaving || !isValidAmount} aria-busy={isSaving}>{isSaving ? "Saving…" : "Save leftover"}</Button></footer>
			</section>
		</div>
	);
};

export default LeftoverCompletionDialog;
