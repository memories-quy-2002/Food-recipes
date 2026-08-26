import { ArrowRight, CalendarCheck2, ChefHat, Clock3, ShoppingBasket } from "lucide-react";
import { Link } from "react-router-dom";
import PageHelmet from "@/shared/seo/PageHelmet";
import Button from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { useActiveCookingSessionQuery, useCookingHistoryQuery } from "./api/historyQueries";
import type { CookingHistoryItem } from "./api/historyApi";
import type { CookingSession } from "./api/cookingSessionApi";

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

type CookingResumeContext = Pick<
	CookingHistoryItem | CookingSession,
	"recipe_id" | "meal_plan_item_id" | "planned_date" | "slot" | "servings"
>;

const replayHref = (item: CookingResumeContext) => {
	const params = new URLSearchParams({ id: String(item.recipe_id) });
	if (item.meal_plan_item_id && item.planned_date && item.slot) {
		params.set("planItemId", String(item.meal_plan_item_id));
		params.set("date", item.planned_date.slice(0, 10));
		params.set("slot", item.slot);
		params.set("servings", String(item.servings));
		params.set("returnTo", "/history");
	}
	return `/recipe/cooking?${params.toString()}`;
};

const HistoryPage = () => {
	const historyQuery = useCookingHistoryQuery();
	const activeSessionQuery = useActiveCookingSessionQuery();
	const items = historyQuery.data?.items ?? [];
	const activeSession = activeSessionQuery.data?.session;

	return (
		<main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-10" aria-labelledby="history-title">
			<PageHelmet title="Cooking history" description="Review the recipes you have cooked and find your next idea." path="/history" noIndex />
			<div className="mx-auto w-full max-w-[96rem] space-y-8">
				<header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
					<div className="max-w-3xl">
						<p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-primary">Your kitchen memory</p>
						<h1 id="history-title" className="text-balance text-4xl font-black tracking-[-0.035em] sm:text-5xl">Cooked, remembered, ready to repeat.</h1>
						<p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Keep a simple record of finished recipes, then use it to plan the next meal that fits your kitchen.</p>
					</div>
					<div className="flex flex-col gap-2 sm:flex-row">
						<Button asChild variant="outline"><Link to="/planning"><CalendarCheck2 className="size-4" aria-hidden="true" />Plan next meals</Link></Button>
						<Button asChild variant="outline"><Link to="/shopping-list"><ShoppingBasket className="size-4" aria-hidden="true" />Open shopping list</Link></Button>
					</div>
				</header>

				{activeSession && <Card as="section" className="border-primary/30 bg-primary/5 p-5 sm:p-6" aria-labelledby="active-cooking-title">
					<div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Saved progress</p>
							<h2 id="active-cooking-title" className="mt-1 text-2xl font-black">Continue cooking {activeSession.recipe_name}</h2>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">{activeSession.status === "paused" ? "Paused" : "In progress"} · Step {activeSession.current_step + 1}</p>
						</div>
						<Button asChild><Link to={replayHref(activeSession)}>Continue cooking</Link></Button>
					</div>
				</Card>}

				{historyQuery.isPending ? (
					<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading cooking history">
						{[1, 2, 3].map((item) => <div key={item} className="h-48 animate-pulse rounded-3xl bg-muted" />)}
					</section>
				) : historyQuery.isError ? (
					<section className="rounded-3xl border border-destructive/25 bg-destructive/10 p-7" role="alert">
						<h2 className="text-2xl font-black">History could not load</h2>
						<p className="mt-2 text-muted-foreground">Try again to reconnect your completed cooks.</p>
						<Button className="mt-5" onClick={() => historyQuery.refetch()}>Try again</Button>
					</section>
				) : items.length === 0 ? (
					<Card as="section" className="p-8 text-center sm:p-12">
						<ChefHat className="mx-auto size-12 text-primary" aria-hidden="true" />
						<h2 className="mt-4 text-2xl font-black">Your first finished cook will appear here.</h2>
						<p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">Choose a recipe, start cooking mode, and finish the final step. Your history stays private to your account.</p>
						<Button asChild className="mt-6"><Link to="/food">Find a recipe <ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
					</Card>
				) : (
					<section aria-labelledby="history-list-title">
						<div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Recent cooks</p><h2 id="history-list-title" className="mt-1 text-2xl font-black sm:text-3xl">Your cooking history</h2></div><span className="text-sm font-semibold text-muted-foreground" role="status" aria-live="polite">{items.length} saved cook{items.length === 1 ? "" : "s"}</span></div>
						<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{items.map((item) => (
								<li key={item.history_id}>
									<Card as="article" className="flex h-full flex-col p-5 sm:p-6">
										<div className="flex items-start justify-between gap-3"><span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-secondary px-3 text-xs font-black uppercase tracking-[0.12em] text-secondary-foreground"><Clock3 className="size-3.5" aria-hidden="true" />{item.meal_plan_item_id ? "Planned cook" : "Recipe cook"}</span><span className="text-xs font-semibold text-muted-foreground">{formatDate(item.completed_at)}</span></div>
										<h3 className="mt-5 text-xl font-black leading-tight">{item.recipe_name}</h3>
										<p className="mt-2 text-sm leading-6 text-muted-foreground">{item.servings} serving{item.servings === 1 ? "" : "s"}{item.slot ? ` · ${item.slot[0].toUpperCase()}${item.slot.slice(1)}` : ""}</p>
										<div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row"><Button asChild variant="outline" className="sm:flex-1"><Link to={`/recipe?id=${item.recipe_id}`}>Review recipe</Link></Button><Button asChild className="sm:flex-1"><Link to={replayHref(item)}>Cook again</Link></Button></div>
									</Card>
								</li>
							))}
						</ul>
					</section>
				)}

			</div>
		</main>
	);
};

export { formatDate, replayHref };
export default HistoryPage;
