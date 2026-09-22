import { useRecipeCookingMemoryQuery } from "@/features/history/api/historyQueries";
import Button from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Link } from "react-router-dom";

type RecipeCookingMemoryProps = { userId: number; recipeId: number };

const formatMemoryDate = (value: string): string =>
	new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));

const RecipeCookingMemory = ({ userId, recipeId }: RecipeCookingMemoryProps) => {
	const memoryQuery = useRecipeCookingMemoryQuery(userId, recipeId);
	const memory = memoryQuery.data;
	const latestCook = memory?.latest_cook;

	if (memoryQuery.isPending) {
		return <div className="mx-auto w-full max-w-[100rem] px-4 pb-4 sm:px-6 lg:px-8 2xl:max-w-[108rem]" aria-busy="true" aria-label="Loading your cooking memory"><div className="h-36 animate-pulse rounded-3xl bg-muted" /></div>;
	}

	if (memoryQuery.isError) {
		return (
			<div className="mx-auto w-full max-w-[100rem] px-4 pb-4 sm:px-6 lg:px-8 2xl:max-w-[108rem]">
				<Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between" role="alert">
					<p className="text-sm text-muted-foreground">Your cooking memory could not load.</p>
					<Button variant="outline" onClick={() => memoryQuery.refetch()}>Try again</Button>
				</Card>
			</div>
		);
	}

	if (!memory || !latestCook || memory.cook_count < 1) return null;

	const journalHref = `/history/journal?historyId=${latestCook.history_id}&returnTo=${encodeURIComponent(`/recipe?id=${recipeId}`)}`;

	return (
		<div className="mx-auto w-full max-w-[100rem] px-4 pb-4 sm:px-6 lg:px-8 2xl:max-w-[108rem]">
			<Card as="section" className="border-primary/20 bg-primary/[0.03] p-5 sm:p-6" aria-labelledby="recipe-cooking-memory-title">
				<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
					<div>
						<p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Your recipe memory</p>
						<h2 id="recipe-cooking-memory-title" className="mt-1 text-xl font-black sm:text-2xl">You have cooked this {memory.cook_count} {memory.cook_count === 1 ? "time" : "times"}</h2>
						<p className="mt-2 text-sm text-muted-foreground">Last cooked {formatMemoryDate(latestCook.completed_at)} · {latestCook.servings} {latestCook.servings === 1 ? "serving" : "servings"}</p>
					</div>
					<Button asChild variant="outline" className="shrink-0"><Link to={journalHref}>Open private cooking journal</Link></Button>
				</div>
				<div className="mt-5 border-t border-border/70 pt-4">
					<p className="text-sm font-bold">Your last reflection</p>
					{latestCook.journal ? (
						<div className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
							<div className="flex flex-wrap gap-x-4 gap-y-1">
								{latestCook.journal.rating !== null && <span>Rated {latestCook.journal.rating}/5</span>}
								{latestCook.journal.would_cook_again !== null && <span>{latestCook.journal.would_cook_again ? "Would cook again" : "Would not cook again"}</span>}
							</div>
							{latestCook.journal.notes && <p className="whitespace-pre-wrap break-words">{latestCook.journal.notes}</p>}
							{latestCook.journal.rating === null && latestCook.journal.would_cook_again === null && !latestCook.journal.notes && <p>No private note saved yet.</p>}
						</div>
					) : (
						<p className="mt-2 text-sm leading-6 text-muted-foreground">Add a private note about what worked or what you would change next time.</p>
					)}
				</div>
			</Card>
		</div>
	);
};

export default RecipeCookingMemory;
