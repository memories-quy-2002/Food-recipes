import { useState, type ReactElement } from "react";
import { ArrowRight, CalendarDays, Check, ChefHat, PackageCheck, ShoppingBasket, TimerReset } from "lucide-react";
import { Link } from "react-router-dom";
import type { KitchenState } from "@/shared/api/contracts";
import { usePrepareRecipeIngredientsMutation } from "@/features/shopping/api/shoppingQueries";
import type { PrepareRecipeResponse } from "@/features/shopping/api/shoppingApi";
import PreparationSummary from "@/features/shopping/PreparationSummary";
import Button from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { useLeftoversQuery } from "@/features/leftovers/api/leftoversQueries";
import { useHouseholdScope } from "@/features/households/HouseholdScopeProvider";
import type { KitchenScope } from "@/features/households/householdScope";

type KitchenCommandCenterProps = {
	kitchen: KitchenState;
	userId?: number | string;
};

const ONBOARDING_STORAGE_PREFIX = "food-recipes:onboarding:kitchen:";

const formatDate = (value: string): string => new Intl.DateTimeFormat(undefined, {
	weekday: "short",
	month: "short",
	day: "numeric",
}).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));

const cookingHref = (session: KitchenState["active_session"]): string => {
	if (!session) return "/history";
	const params = new URLSearchParams({ id: String(session.recipe_id) });
	if (session.meal_plan_item_id && session.planned_date && session.slot) {
		params.set("planItemId", String(session.meal_plan_item_id));
		params.set("date", session.planned_date.slice(0, 10));
		params.set("slot", session.slot);
		params.set("servings", String(session.servings));
		params.set("returnTo", "/");
	}
	return `/recipe/cooking?${params.toString()}`;
};

const mealCookingHref = (meal: NonNullable<KitchenState["next_meal"]>, scope: KitchenScope): string => {
	const params = new URLSearchParams({
		id: String(meal.recipe_id),
		planItemId: String(meal.item_id),
		date: meal.planned_date.slice(0, 10),
		slot: meal.slot,
		servings: String(meal.servings),
		returnTo: "/",
	});
	if (scope.kind === "household") params.set("householdId", String(scope.householdId));
	return `/recipe/cooking?${params.toString()}`;
};

const progressSteps = (kitchen: KitchenState): Array<{ key: string; label: string; href: string; complete: boolean }> => {
	const hasChosenRecipe = kitchen.progress.saved_recipes > 0 || kitchen.progress.planned_meals > 0 || kitchen.progress.completed_cooks > 0;
	const hasPreparedMeal = kitchen.shopping.completed_items > 0 || kitchen.pantry.available_items > 0;
	return [
		{ key: "choose", label: "Choose a recipe", href: "/food", complete: hasChosenRecipe },
		{ key: "plan", label: "Plan a meal", href: "/planning", complete: kitchen.progress.planned_meals > 0 },
		{ key: "prepare", label: "Prepare ingredients", href: "/shopping-list", complete: hasPreparedMeal },
		{ key: "cook", label: "Cook and save the result", href: kitchen.active_session ? cookingHref(kitchen.active_session) : "/food", complete: kitchen.progress.completed_cooks > 0 },
	];
};

const KitchenCommandCenter = ({ kitchen, userId = "current" }: KitchenCommandCenterProps): ReactElement => {
	const { scope } = useHouseholdScope();
	const [isOnboardingDismissed, setIsOnboardingDismissed] = useState(() => {
		if (typeof window === "undefined") return false;
		return window.localStorage.getItem(`${ONBOARDING_STORAGE_PREFIX}${userId}`) === "dismissed";
	});
	const [preparationResult, setPreparationResult] = useState<PrepareRecipeResponse | null>(null);
	const prepareMutation = usePrepareRecipeIngredientsMutation();
	const leftoversQuery = useLeftoversQuery(scope);
	const leftovers = leftoversQuery.data?.items ?? [];
	const leftoverServings = leftovers.reduce((total, item) => total + item.remaining_servings, 0);
	const steps = progressSteps(kitchen);
	const activeSession = kitchen.active_session;
	const nextMeal = kitchen.next_meal;

	const dismissOnboarding = (): void => {
		setIsOnboardingDismissed(true);
		window.localStorage.setItem(`${ONBOARDING_STORAGE_PREFIX}${userId}`, "dismissed");
	};

	const prepareNextMeal = (): void => {
		if (!nextMeal || prepareMutation.isPending) return;
		setPreparationResult(null);
		prepareMutation.mutate(
			{ recipeId: nextMeal.recipe_id, servings: nextMeal.servings },
			{ onSuccess: setPreparationResult },
		);
	};

	return (
		<section className="space-y-5" aria-labelledby="kitchen-command-center-title">
			<div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-sm sm:p-8">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Your kitchen at a glance</p>
						<h2 id="kitchen-command-center-title" className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Know what to do next.</h2>
						<p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Your plan, ingredients, and cooking progress stay connected so you can leave and come back without starting over.</p>
					</div>
					<Link className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-primary underline-offset-4 hover:underline" to="/history">View activity <ArrowRight className="size-4" aria-hidden="true" /></Link>
				</div>

				<div className="mt-6 grid gap-4 lg:grid-cols-2">
					<Card className={activeSession ? "border-primary/30 bg-card p-5" : "p-5"}>
						<div className="flex items-start justify-between gap-4">
							<div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary"><TimerReset className="size-5" aria-hidden="true" /></div>
							{activeSession && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-primary">{activeSession.status === "paused" ? "Paused" : "In progress"}</span>}
						</div>
						{activeSession ? <>
							<h3 className="mt-4 text-xl font-black">Continue {activeSession.recipe_name}</h3>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">Step {Math.min(activeSession.current_step + 1, Math.max(activeSession.total_steps, 1))} of {Math.max(activeSession.total_steps, 1)} · {activeSession.servings} servings</p>
							<Button asChild className="mt-5"><Link to={cookingHref(activeSession)}>Continue cooking <ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
						</> : <>
							<h3 className="mt-4 text-xl font-black">No cooking session waiting</h3>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">Start a recipe when you are ready. Your step progress will be saved automatically.</p>
							<Button asChild variant="outline" className="mt-5"><Link to="/food">Find a recipe <ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
						</>}
					</Card>

					<Card className="p-5">
						<div className="flex items-start justify-between gap-4">
							<div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary"><CalendarDays className="size-5" aria-hidden="true" /></div>
							{nextMeal && <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Next meal</span>}
						</div>
						{nextMeal ? <>
							<h3 className="mt-4 text-xl font-black">{nextMeal.recipe_name}</h3>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">{formatDate(nextMeal.planned_date)} · {nextMeal.slot[0].toUpperCase() + nextMeal.slot.slice(1)} · {nextMeal.servings} servings</p>
							<div className="mt-5 flex flex-wrap gap-2">
								<Button type="button" onClick={prepareNextMeal} disabled={prepareMutation.isPending} aria-busy={prepareMutation.isPending}>{prepareMutation.isPending ? "Checking pantry…" : "Prepare this meal"}</Button>
								<Button asChild variant="outline"><Link to={mealCookingHref(nextMeal, scope)}>Start cooking</Link></Button>
							</div>
							{preparationResult && <PreparationSummary result={preparationResult} />}
						</> : <>
							<h3 className="mt-4 text-xl font-black">Plan your next meal</h3>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">A planned meal tells you what to prepare and makes returning later simple.</p>
							<Button asChild variant="outline" className="mt-5"><Link to="/planning">Open planning <ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
						</>}
					</Card>
				</div>

				<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					<Link className="rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40" to="/shopping-list"><div className="flex items-center gap-2 text-primary"><ShoppingBasket className="size-4" aria-hidden="true" /><span className="text-xs font-black uppercase tracking-[0.12em]">Shopping</span></div><p className="mt-3 text-2xl font-black">{kitchen.shopping.open_items}</p><p className="text-sm text-muted-foreground">items to buy</p></Link>
					<Link className="rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40" to="/pantry"><div className="flex items-center gap-2 text-primary"><PackageCheck className="size-4" aria-hidden="true" /><span className="text-xs font-black uppercase tracking-[0.12em]">Pantry</span></div><p className="mt-3 text-2xl font-black">{kitchen.pantry.available_items}</p><p className="text-sm text-muted-foreground">available items</p></Link>
					<Link className="rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40" to="/history"><div className="flex items-center gap-2 text-primary"><ChefHat className="size-4" aria-hidden="true" /><span className="text-xs font-black uppercase tracking-[0.12em]">History</span></div><p className="mt-3 text-2xl font-black">{kitchen.progress.completed_cooks}</p><p className="text-sm text-muted-foreground">completed cooks</p></Link>
					<Link className="rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40" to="/planning" aria-label="Use leftovers in planning"><div className="flex items-center gap-2 text-primary"><PackageCheck className="size-4" aria-hidden="true" /><span className="text-xs font-black uppercase tracking-[0.12em]">Leftovers</span></div><p className="mt-3 text-2xl font-black">{leftoverServings}</p><p className="text-sm text-muted-foreground">{leftovers.length ? "servings ready" : leftoversQuery.isPending ? "checking…" : "save extras to reuse"}</p>{leftovers.length > 0 && <span className="mt-3 inline-flex text-sm font-black text-primary underline-offset-4 hover:underline">Use tonight <ArrowRight className="ml-1 size-4" aria-hidden="true" /></span>}</Link>
				</div>
			</div>

			{!isOnboardingDismissed && <Card className="p-5 sm:p-6" aria-labelledby="kitchen-start-title">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Start here</p><h3 id="kitchen-start-title" className="mt-1 text-2xl font-black">How your kitchen works</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Follow the four steps once. After that, this page will always point you to the next one.</p></div>
					<button type="button" className="min-h-11 self-start text-sm font-bold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" onClick={dismissOnboarding}>Hide guide</button>
				</div>
				<ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
					{steps.map((step, index) => <li key={step.key}><Link className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 py-3 transition hover:border-primary/40 ${step.complete ? "border-primary/20 bg-primary/5" : "border-border bg-background"}`} to={step.href}><span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${step.complete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{step.complete ? <Check className="size-4" aria-hidden="true" /> : index + 1}</span><span className="min-w-0 text-sm font-bold">{step.label}</span></Link></li>)}
				</ol>
			</Card>}
		</section>
	);
};

export { cookingHref, formatDate, progressSteps };
export default KitchenCommandCenter;
