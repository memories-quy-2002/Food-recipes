import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, X } from "lucide-react";
import Button from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import type { RecipeDetail } from "@/shared/api/contracts";
import { useCookingMode, getCookingInstructions } from "./useCookingMode";
import ManualTimer from "./ManualTimer";

type CookingRecipe = Partial<RecipeDetail> & { id?: number | string; slug?: string };
type CookingModeProps = { recipe?: CookingRecipe | null; onExit: () => void; planningContext?: { date: string; slot: string; servings: number; returnTo?: string }; onBackToPlan?: () => void };
const useCookingModeWithIdentity = useCookingMode as (instructions: CookingRecipe["instructions"], recipeIdentity?: number | string | null) => ReturnType<typeof useCookingMode>;
const formatPlanningContext = (planningContext: NonNullable<CookingModeProps["planningContext"]>) => { const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(new Date(`${planningContext.date}T00:00:00Z`)); const slot = planningContext.slot[0].toUpperCase() + planningContext.slot.slice(1); return `${weekday} · ${slot} · ${planningContext.servings} servings`; };

const CookingMode = ({ recipe, onExit, planningContext, onBackToPlan }: CookingModeProps) => {
	const mainRef = useRef<HTMLElement | null>(null); const [isComplete, setIsComplete] = useState(false);
	const { steps, stepIndex, isFirstStep, isLastStep, goToPrevious, goToNext } = useCookingModeWithIdentity(recipe?.instructions, recipe?.recipe_id ?? recipe?.id ?? recipe?.slug ?? null);
	useEffect(() => { mainRef.current?.focus(); }, []);
	const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => { if (event.key === "ArrowLeft" && !isFirstStep) { event.preventDefault(); goToPrevious(); } if (event.key === "ArrowRight" && !isLastStep) { event.preventDefault(); goToNext(); } if (event.key === "Escape") { event.preventDefault(); onExit(); } };
	const handleFinish = () => planningContext ? setIsComplete(true) : onExit();
	const progress = steps.length ? Math.round(((stepIndex + 1) / steps.length) * 100) : 0;
	return <main ref={mainRef} tabIndex={-1} onKeyDown={handleKeyDown} aria-labelledby="cooking-mode-title" className="min-h-screen bg-background px-4 py-4 outline-none sm:px-6 sm:py-6 lg:px-8">
		<div className="mx-auto w-full max-w-5xl"><header className="mb-5 flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Guided cooking</p>{planningContext && <p className="mt-1 text-sm font-semibold text-muted-foreground">{formatPlanningContext(planningContext)}</p>}</div><Button variant="outline" onClick={onExit}><X className="size-4" />Exit cooking</Button></header>
			<Card className="overflow-hidden"><div className="border-b border-border p-5 sm:p-7"><h1 id="cooking-mode-title" className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{recipe?.recipe_name || "Cooking mode"}</h1>{!isComplete && steps.length > 0 && <div className="mt-5"><div className="mb-2 flex items-center justify-between gap-3 text-sm font-bold"><span aria-live="polite">Step {stepIndex + 1} of {steps.length}</span><span className="text-muted-foreground">{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true"><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} /></div></div>}</div>
				<div className="p-5 sm:p-7 lg:p-9">{isComplete ? <section className="py-8 text-center" aria-live="polite"><CheckCircle2 className="mx-auto size-14 text-emerald-600" /><p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-primary">Cooked with your plan</p><h2 className="mt-2 text-3xl font-black">Recipe complete</h2><p className="mx-auto mt-3 max-w-lg leading-7 text-muted-foreground">Nice work. Keep this meal in your plan or return to the recipe to leave a review.</p><div className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">{onBackToPlan && <Button variant="outline" className="sm:flex-1" onClick={onBackToPlan}>Back to plan</Button>}<Button className="sm:flex-1" onClick={onExit}>Review recipe</Button></div></section> : steps.length > 0 ? <><section className="rounded-2xl bg-secondary/55 p-5 sm:p-7" aria-label={`Step ${stepIndex + 1}`}><p className="text-xl font-bold leading-9 text-foreground sm:text-2xl sm:leading-10">{steps[stepIndex]}</p></section><ManualTimer /><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3"><Button variant="outline" size="lg" onClick={goToPrevious} disabled={isFirstStep}><ArrowLeft className="size-4" />Previous</Button><Button variant="outline" size="lg" onClick={goToNext} disabled={isLastStep}>Next<ArrowRight className="size-4" /></Button><Button size="lg" className="col-span-2 sm:col-span-1" onClick={handleFinish} disabled={!isLastStep}>Finish cooking</Button></div><p className="mt-4 text-center text-xs text-muted-foreground">Keyboard: ← / → changes steps · Escape exits cooking</p></> : <div className="rounded-2xl border border-dashed border-border p-8 text-center" role="status"><h2 className="text-xl font-bold">No cooking steps yet</h2><p className="mt-2 text-muted-foreground">This recipe does not have any instructions to guide you through.</p></div>}</div>
			</Card>
		</div>
	</main>;
};
export { getCookingInstructions };
export default CookingMode;
