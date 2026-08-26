import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, X } from "lucide-react";
import Button from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import type { RecipeDetail } from "@/shared/api/contracts";
import { useCookingMode, getCookingInstructions } from "./useCookingMode";
import ManualTimer from "./ManualTimer";

type CookingRecipe = Partial<RecipeDetail> & { id?: number | string; slug?: string };
type CookingModeProps = {
	recipe?: CookingRecipe | null;
	onExit: () => Promise<void> | void;
	planningContext?: { date: string; slot: string; servings: number; planItemId?: number; returnTo?: string };
	onBackToPlan?: () => void;
	onComplete?: () => Promise<void> | void;
	initialStepIndex?: number;
	isSessionReady?: boolean;
	sessionError?: string | null;
	onStepChange?: (stepIndex: number) => void;
	onPause?: () => Promise<void> | void;
};

const useCookingModeWithIdentity = useCookingMode as (
	instructions: CookingRecipe["instructions"],
	recipeIdentity?: number | string | null,
	initialStepIndex?: number,
) => ReturnType<typeof useCookingMode>;

const formatPlanningContext = (planningContext: NonNullable<CookingModeProps["planningContext"]>) => {
	const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(new Date(`${planningContext.date}T00:00:00Z`));
	const slot = planningContext.slot[0].toUpperCase() + planningContext.slot.slice(1);
	return `${weekday} · ${slot} · ${planningContext.servings} servings`;
};

const CookingMode = ({
	recipe,
	onExit,
	planningContext,
	onBackToPlan,
	onComplete,
	initialStepIndex = 0,
	isSessionReady = true,
	sessionError,
	onStepChange,
	onPause,
}: CookingModeProps) => {
	const mainRef = useRef<HTMLElement | null>(null);
	const restoredStepKey = useRef("");
	const [isComplete, setIsComplete] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isExiting, setIsExiting] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const recipeIdentity = recipe?.recipe_id ?? recipe?.id ?? recipe?.slug ?? null;
	const { steps, stepIndex, isFirstStep, isLastStep, goToPrevious, goToNext } = useCookingModeWithIdentity(recipe?.instructions, recipeIdentity, initialStepIndex);

	useEffect(() => {
		mainRef.current?.focus();
	}, []);

	useEffect(() => {
		if (!isSessionReady) return;
		const restoreKey = `${recipeIdentity}:${initialStepIndex}`;
		if (restoredStepKey.current !== restoreKey) {
			restoredStepKey.current = restoreKey;
			return;
		}
		if (stepIndex !== initialStepIndex) onStepChange?.(stepIndex);
	}, [initialStepIndex, isSessionReady, onStepChange, recipeIdentity, stepIndex]);

	const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
		if (event.key === "ArrowLeft" && !isFirstStep) {
			event.preventDefault();
			goToPrevious();
		}
		if (event.key === "ArrowRight" && !isLastStep) {
			event.preventDefault();
			goToNext();
		}
		if (event.key === "Escape") {
			event.preventDefault();
			handleExit();
		}
	};

	const handleFinish = () => {
		if (!isSessionReady || !isLastStep || isSaving) return;
		if (!onComplete) {
			if (planningContext) setIsComplete(true);
			else onExit();
			return;
		}
		setSaveError(null);
		setIsSaving(true);
		void (async () => {
			try {
				await onComplete();
				if (planningContext) setIsComplete(true);
				else onExit();
			} catch {
				setSaveError("We could not save this cook yet. Try finishing again.");
			} finally {
				setIsSaving(false);
			}
		})();
	};

	const handleExit = () => {
		if (isExiting) return;
		setIsExiting(true);
		void Promise.resolve(onPause?.())
			.catch(() => undefined)
			.finally(() => onExit());
	};
	const progress = steps.length ? Math.round(((stepIndex + 1) / steps.length) * 100) : 0;

	return (
		<main ref={mainRef} tabIndex={-1} onKeyDown={handleKeyDown} aria-labelledby="cooking-mode-title" className="min-h-screen bg-background px-4 py-4 outline-none sm:px-6 sm:py-6 lg:px-8">
			<div className="mx-auto w-full max-w-5xl">
				<header className="mb-5 flex items-center justify-between gap-3">
					<div>
						<p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Guided cooking</p>
						{planningContext && <p className="mt-1 text-sm font-semibold text-muted-foreground">{formatPlanningContext(planningContext)}</p>}
					</div>
						<Button variant="outline" onClick={handleExit} disabled={isExiting} aria-label="Pause and exit cooking"><X className="size-4" aria-hidden="true" />{isExiting ? "Saving…" : "Pause & exit"}</Button>
				</header>

				<Card className="overflow-hidden">
					<div className="border-b border-border p-5 sm:p-7">
						<h1 id="cooking-mode-title" className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{recipe?.recipe_name || "Cooking mode"}</h1>
						{!isComplete && steps.length > 0 && <div className="mt-5"><div className="mb-2 flex items-center justify-between gap-3 text-sm font-bold"><span aria-live="polite">Step {stepIndex + 1} of {steps.length}</span><span className="text-muted-foreground">{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true"><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} /></div></div>}
					</div>

					<div className="p-5 sm:p-7 lg:p-9">
						{!isSessionReady && <p className="mb-5 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground" role="status" aria-live="polite">Restoring your saved cooking progress…</p>}
						{sessionError && <p className="mb-5 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground" role="status">{sessionError}</p>}
						{isComplete ? <section className="py-8 text-center" aria-live="polite"><CheckCircle2 className="mx-auto size-14 text-primary" aria-hidden="true" /><p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-primary">Cooked with your plan</p><h2 className="mt-2 text-3xl font-black">Recipe complete</h2><p className="mx-auto mt-3 max-w-lg leading-7 text-muted-foreground">Nice work. Keep this meal in your plan or return to the recipe to leave a review.</p><div className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">{onBackToPlan && <Button variant="outline" className="sm:flex-1" onClick={onBackToPlan} aria-label="Back to plan">Back to plan</Button>}<Button className="sm:flex-1" onClick={onExit} aria-label="Review recipe">Review recipe</Button></div></section> : steps.length > 0 ? <><section className="rounded-2xl bg-secondary/55 p-5 sm:p-7" aria-label={`Step ${stepIndex + 1}`}><p className="text-xl font-bold leading-9 text-foreground sm:text-2xl sm:leading-10">{steps[stepIndex]}</p></section><ManualTimer /><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3"><Button variant="outline" size="lg" onClick={goToPrevious} disabled={!isSessionReady || isFirstStep} aria-label="Previous step"><ArrowLeft className="size-4" aria-hidden="true" />Previous</Button><Button variant="outline" size="lg" onClick={goToNext} disabled={!isSessionReady || isLastStep} aria-label="Next step">Next<ArrowRight className="size-4" aria-hidden="true" /></Button><Button size="lg" className="col-span-2 sm:col-span-1" onClick={handleFinish} disabled={!isSessionReady || !isLastStep || isSaving} aria-busy={isSaving} aria-label="Finish cooking">{isSaving ? "Saving…" : "Finish cooking"}</Button></div>{saveError && <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-center text-sm font-semibold text-destructive" role="alert">{saveError}</p>}<p className="mt-4 text-center text-xs text-muted-foreground">Keyboard: ← / → changes steps · Escape exits cooking</p></> : <div className="rounded-2xl border border-dashed border-border p-8 text-center" role="status"><h2 className="text-xl font-bold">No cooking steps yet</h2><p className="mt-2 text-muted-foreground">This recipe does not have any instructions to guide you through.</p></div>}
					</div>
				</Card>
			</div>
		</main>
	);
};

export { getCookingInstructions };
export default CookingMode;
