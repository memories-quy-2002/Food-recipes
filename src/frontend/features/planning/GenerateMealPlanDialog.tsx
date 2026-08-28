import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import GeneratedPlanPreview from "./GeneratedPlanPreview";
import type { GenerateMealPlanInput, MealPlanPreview, MealPlanPreviewItem } from "./api/planningApi";
import { useCreateMealPlanFromPreviewMutation, useGenerateMealPlanPreviewMutation } from "./api/planningQueries";

type GenerateMealPlanDialogProps = {
	open: boolean;
	from: string;
	to: string;
	onClose: () => void;
};

const GenerateMealPlanDialog = ({ open, from, to, onClose }: GenerateMealPlanDialogProps) => {
	const [targetMeals, setTargetMeals] = useState(7);
	const [preview, setPreview] = useState<MealPlanPreview | null>(null);
	const generateMutation = useGenerateMealPlanPreviewMutation();
	const saveMutation = useCreateMealPlanFromPreviewMutation();
	const isRegenerating = generateMutation.isPending;

	useEffect(() => {
		if (!open) {
			setPreview(null);
			setTargetMeals(7);
		}
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && !generateMutation.isPending && !saveMutation.isPending) onClose(); };
		window.addEventListener("keydown", handleKeyDown);
		return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handleKeyDown); };
	}, [generateMutation.isPending, onClose, open, saveMutation.isPending]);

	if (!open) return null;

	const lockState = (nextPreview: MealPlanPreview, previous: MealPlanPreview | null): MealPlanPreview => {
		if (!previous) return nextPreview;
		const previousLocks = new Map(previous.items.map((item) => [`${item.date}:${item.slot}`, item.locked]));
		return { ...nextPreview, items: nextPreview.items.map((item) => ({ ...item, locked: previousLocks.get(`${item.date}:${item.slot}`) ?? item.locked })) };
	};

	const requestPreview = (input: GenerateMealPlanInput, previous: MealPlanPreview | null = preview) => {
		generateMutation.mutate(input, { onSuccess: (nextPreview) => setPreview(lockState(nextPreview, previous)) });
	};

	const generate = () => {
		if (!Number.isInteger(targetMeals) || targetMeals < 1 || targetMeals > 31) return;
		requestPreview({ name: "This week", from, to, targetMeals });
	};

	const regenerateUnlocked = () => {
		if (!preview) return;
		requestPreview({
			name: preview.name,
			from: preview.from,
			to: preview.to,
			targetMeals: preview.targetMeals,
			slots: preview.items.map(({ date, slot, servings }) => ({ date, slot, servings })),
			lockedItems: preview.items.filter((item) => item.locked).map(({ date, slot, servings, recipeId }) => ({ date, slot, servings, recipeId })),
		}, preview);
	};

	const swap = (target: MealPlanPreviewItem) => {
		if (!preview) return;
		requestPreview({
			name: preview.name,
			from: preview.from,
			to: preview.to,
			targetMeals: preview.targetMeals,
			slots: preview.items.map(({ date, slot, servings }) => ({ date, slot, servings })),
			lockedItems: preview.items.filter((item) => item !== target).map(({ date, slot, servings, recipeId }) => ({ date, slot, servings, recipeId })),
			excludedRecipeIds: [target.recipeId],
		}, preview);
	};

	const toggleLock = (target: MealPlanPreviewItem) => {
		if (!preview) return;
		setPreview({ ...preview, items: preview.items.map((item) => item === target ? { ...item, locked: !item.locked } : item) });
	};

	const save = () => {
		if (!preview) return;
		saveMutation.mutate({ previewToken: preview.previewToken }, { onSuccess: onClose });
	};

	const error = generateMutation.error ? "We could not generate a plan with these constraints. Try again or unlock a meal." : saveMutation.error ? "This preview could not be saved. Generate a new preview and try again." : null;

	return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-4 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !generateMutation.isPending && !saveMutation.isPending) onClose(); }}>
		<section className="mx-auto my-4 max-w-4xl rounded-3xl border border-border bg-card p-5 shadow-2xl sm:my-8 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="generate-meal-plan-title">
			<header className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Smart planning</p><h2 id="generate-meal-plan-title" className="mt-1 text-2xl font-black">Generate your week</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Build a preview from your preferences, pantry, and cooking history. Review every meal before saving.</p></div><Button variant="ghost" size="icon" onClick={onClose} disabled={generateMutation.isPending || saveMutation.isPending} aria-label="Close generate meal plan dialog"><X className="size-5" /></Button></header>
			{!preview && <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-background p-4 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-end"><div><label className="grid gap-2 text-sm font-bold" htmlFor="target-meals">Meals to plan<Input id="target-meals" type="number" min="1" max="31" value={targetMeals} onChange={(event) => setTargetMeals(Number(event.target.value))} disabled={generateMutation.isPending} /></label><p className="mt-2 text-xs text-muted-foreground">For {from} through {to}.</p></div><div className="text-sm text-muted-foreground">No plan is saved yet.</div><Button type="button" onClick={generate} disabled={generateMutation.isPending} aria-busy={generateMutation.isPending}><Sparkles className="size-4" />{generateMutation.isPending ? "Generating..." : "Generate preview"}</Button></div>}
			{error && !preview && <p className="mt-4 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm font-semibold text-destructive" role="alert">{error}</p>}
			{preview && <GeneratedPlanPreview preview={preview} onSwap={swap} onToggleLock={toggleLock} onRegenerate={regenerateUnlocked} onSave={save} onCancel={onClose} isRegenerating={isRegenerating} isSaving={saveMutation.isPending} error={error} />}
		</section>
	</div>;
};

export default GenerateMealPlanDialog;
