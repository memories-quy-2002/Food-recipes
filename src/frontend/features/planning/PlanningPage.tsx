import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, CalendarDays, List, ShoppingBasket, Sparkles } from "lucide-react";
import PageHelmet from "@/shared/seo/PageHelmet";
import Button from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import type { AddMealPlanItemInput, MealPlanItem, MealSlot } from "./api/planningApi";
import { getWeekRange, shiftWeek, type WeekRange } from "./api/planningDates";
import { useAddMealPlanItemMutation, useCreateMealPlanMutation, useDeleteMealPlanItemMutation, useMealPlanForWeekQuery, useUpdateMealPlanItemMutation } from "./api/planningQueries";
import AddMealDialog from "./components/AddMealDialog";
import MealPlanAgenda from "./components/MealPlanAgenda";
import MealPlanGrid from "./components/MealPlanGrid";
import WeekNavigator from "./components/WeekNavigator";
import GenerateMealPlanDialog from "./GenerateMealPlanDialog";
import { useHouseholdScope } from "@/features/households/HouseholdScopeProvider";

type DialogState = { date: string; slot: MealSlot; item?: MealPlanItem };
type PlanningView = "calendar" | "agenda";

const PLANNING_VIEW_STORAGE_KEY = "food-recipes:planning-view";

const readStoredWeek = (): WeekRange => {
	if (typeof window === "undefined") return getWeekRange(new Date());
	try {
		const stored = JSON.parse(window.localStorage.getItem(PLANNING_VIEW_STORAGE_KEY) || "null") as { from?: unknown } | null;
		if (typeof stored?.from !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(stored.from)) return getWeekRange(new Date());
		return getWeekRange(new Date(`${stored.from}T00:00:00`));
	} catch {
		return getWeekRange(new Date());
	}
};

const PlanningPage = () => {
	const { scope, canEdit, scopeLabel } = useHouseholdScope();
	const [visibleWeek, setVisibleWeek] = useState<WeekRange>(readStoredWeek);
	const [dialogState, setDialogState] = useState<DialogState | null>(null);
	const [planningView, setPlanningView] = useState<PlanningView>("calendar");
	const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
	const mealPlanQuery = useMealPlanForWeekQuery(visibleWeek, {}, scope);
	const createPlanMutation = useCreateMealPlanMutation(scope);
	const addMealMutation = useAddMealPlanItemMutation(scope);
	const updateMealMutation = useUpdateMealPlanItemMutation(scope);
	const deleteMealMutation = useDeleteMealPlanItemMutation(scope);
	const activePlan = mealPlanQuery.data?.plan;
	const currentWeek = getWeekRange(new Date());
	const isMealMutationPending = addMealMutation.isPending || updateMealMutation.isPending;
	const mutationError = addMealMutation.error || updateMealMutation.error ? "We could not save this meal. Try again." : null;
	const moveWeek = (offset: number) => setVisibleWeek((range) => shiftWeek(range.from, offset));
	useEffect(() => {
		window.localStorage.setItem(PLANNING_VIEW_STORAGE_KEY, JSON.stringify({ from: visibleWeek.from }));
	}, [visibleWeek.from]);
	const createPlan = () => { if (canEdit) createPlanMutation.mutate({ name: "This week", from: visibleWeek.from, to: visibleWeek.to }); };
	const handleMealSubmit = (input: AddMealPlanItemInput, itemId?: number) => {
		if (!canEdit) return;
		if (!activePlan) return;
		if (itemId) { updateMealMutation.mutate({ planId: activePlan.plan_id, itemId, input }, { onSuccess: () => setDialogState(null) }); return; }
		addMealMutation.mutate({ planId: activePlan.plan_id, input }, { onSuccess: () => setDialogState(null) });
	};
	const handleRemoveMeal = (item: MealPlanItem) => { if (!canEdit || !activePlan || !window.confirm(`Remove ${item.recipe_name} from your plan?`)) return; deleteMealMutation.mutate({ planId: activePlan.plan_id, itemId: item.item_id }); };
	const handleMoveMeal = (item: MealPlanItem, input: Pick<AddMealPlanItemInput, "date" | "slot">) => { if (!canEdit || !activePlan) return; updateMealMutation.mutate({ planId: activePlan.plan_id, itemId: item.item_id, input }); };

	return <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-10" aria-labelledby="planning-title">
		<PageHelmet title="Planning" description="Plan your meals for the week and keep cooking days organized." path="/planning" noIndex />
		<div className="mx-auto w-full max-w-[96rem]">
		<header className="mb-7 flex flex-col gap-5 lg:flex-col lg:items-end lg:justify-between xl:flex-row"><div className="max-w-3xl"><p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-primary">{scopeLabel}</p><h1 id="planning-title" className="text-4xl font-black tracking-[-0.035em] sm:text-5xl lg:text-6xl">Plan with intention</h1><p className="sr-only">Put recipes on the days you actually want to cook them, set servings once, and make the week easier to execute.</p></div><div className="flex w-full flex-col gap-2 sm:flex-row lg:w-full xl:w-auto">{canEdit && scope.kind === "personal" && <Button className="flex-1 xl:flex-none" onClick={() => setIsGenerateDialogOpen(true)}><Sparkles className="size-4" aria-hidden="true" />Generate week</Button>}<Button asChild variant="outline" className="flex-1 xl:flex-none"><Link to="/wishlist"><Bookmark className="size-4" aria-hidden="true" />Saved recipes</Link></Button><Button asChild className="flex-1 xl:flex-none"><Link to="/shopping-list"><ShoppingBasket className="size-4" aria-hidden="true" />Shopping list</Link></Button></div></header>
			<Card className="overflow-hidden p-4 sm:p-5 lg:p-6"><WeekNavigator range={visibleWeek} onPrevious={() => moveWeek(-1)} onNext={() => moveWeek(1)} isCurrentWeek={currentWeek.from === visibleWeek.from} />
				<div className="mt-5">{mealPlanQuery.isPending ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7" role="status" aria-label="Loading your meal plan">{Array.from({ length: 7 }, (_, index) => <div key={index} className="h-64 animate-pulse rounded-2xl bg-muted" />)}</div> : mealPlanQuery.isError ? <div className="rounded-2xl border border-destructive/25 bg-destructive/10 p-6 text-center" role="alert"><h2 className="text-xl font-bold">Your plan could not load</h2><p className="mt-2 text-muted-foreground">We could not fetch this week. Try again to keep your plan in sync.</p><Button className="mt-4" onClick={() => mealPlanQuery.refetch()}>Try again</Button></div> : mealPlanQuery.data === null ? <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-8 text-center"><CalendarDays className="mx-auto size-10 text-primary" /><h2 className="mt-4 text-2xl font-black">Plan your week</h2><p className="mx-auto mt-2 max-w-xl leading-7 text-muted-foreground">Add breakfast, lunch, dinner, or snacks and turn saved recipes into a practical cooking schedule.</p>{canEdit ? <Button className="mt-5" onClick={createPlan} disabled={createPlanMutation.isPending} aria-busy={createPlanMutation.isPending}>{createPlanMutation.isPending ? "Creating plan…" : "Start a weekly plan"}</Button> : <p className="mt-5 text-sm font-semibold text-muted-foreground">You have read-only access to this kitchen.</p>}{createPlanMutation.isError && <p className="mt-3 text-sm font-semibold text-destructive" role="alert">We could not create this plan. Try again.</p>}</div> : <><div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-bold text-muted-foreground">View your week as a calendar or a focused agenda.</p><div className="inline-flex w-full rounded-xl border border-border bg-muted/35 p-1 sm:w-auto" role="group" aria-label="Planning views"><button type="button" aria-pressed={planningView === "calendar"} className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none ${planningView === "calendar" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/70 hover:text-foreground"}`} onClick={() => setPlanningView("calendar")}><CalendarDays className="size-4" aria-hidden="true" />Calendar</button><button type="button" aria-pressed={planningView === "agenda"} className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none ${planningView === "agenda" ? "bg-background text-foreground" : "text-muted-foreground hover:bg-background/70 hover:text-foreground"}`} onClick={() => setPlanningView("agenda")}><List className="size-4" aria-hidden="true" />Agenda</button></div></div><div id="planning-view-panel" className="mt-4" role="region" aria-live="polite" aria-label={`${planningView === "calendar" ? "Calendar" : "Agenda"} meal plan view`}>{planningView === "calendar" ? <MealPlanGrid days={visibleWeek.days} items={mealPlanQuery.data?.items ?? []} onAdd={(date, slot) => setDialogState({ date, slot })} onEdit={(item) => setDialogState({ date: item.planned_date.slice(0, 10), slot: item.slot, item })} onRemove={handleRemoveMeal} onMove={handleMoveMeal} isRemoving={deleteMealMutation.isPending} readOnly={!canEdit} /> : <MealPlanAgenda days={visibleWeek.days} items={mealPlanQuery.data?.items ?? []} onAdd={(date, slot) => setDialogState({ date, slot })} onEdit={(item) => setDialogState({ date: item.planned_date.slice(0, 10), slot: item.slot, item })} onRemove={handleRemoveMeal} onMove={handleMoveMeal} isRemoving={deleteMealMutation.isPending} readOnly={!canEdit} />}</div></>}</div>
			</Card>
		</div>
		<GenerateMealPlanDialog open={isGenerateDialogOpen && canEdit && scope.kind === "personal"} from={visibleWeek.from} to={visibleWeek.to} onClose={() => setIsGenerateDialogOpen(false)} />
		{canEdit && <AddMealDialog open={Boolean(dialogState)} initialDate={dialogState?.date ?? visibleWeek.from} initialSlot={dialogState?.slot ?? "dinner"} item={dialogState?.item} onClose={() => setDialogState(null)} onSubmit={handleMealSubmit} isSubmitting={isMealMutationPending} error={mutationError} />}
	</main>;
};
export default PlanningPage;
