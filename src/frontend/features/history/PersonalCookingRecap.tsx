import { useCookingRecapQuery } from "./api/historyQueries";
import Button from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Link } from "react-router-dom";

type PersonalCookingRecapProps = { userId: number };

const PersonalCookingRecap = ({ userId }: PersonalCookingRecapProps) => {
	const recapQuery = useCookingRecapQuery(userId);
	const recap = recapQuery.data;

	return (
		<section className="space-y-4" aria-labelledby="cooking-recap-title">
			<header>
				<p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Your kitchen, at a glance</p>
				<h2 id="cooking-recap-title" className="mt-1 text-2xl font-black sm:text-3xl">Personal cooking recap</h2>
			</header>
			{recapQuery.isPending ? (
				<div className="grid gap-4 sm:grid-cols-3" aria-busy="true" aria-label="Loading your cooking recap">
					{[1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-3xl bg-muted" />)}
				</div>
			) : recapQuery.isError ? (
				<Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between" role="alert">
					<p className="text-sm text-muted-foreground">Your cooking recap could not load. Your history is still available below.</p>
					<Button variant="outline" onClick={() => recapQuery.refetch()}>Try again</Button>
				</Card>
			) : recap ? (
				<div className="grid gap-4 sm:grid-cols-3">
					<Card as="article" className="p-5 sm:p-6">
						<p className="text-sm font-semibold text-muted-foreground">Completed cooks</p>
						<p className="mt-3 text-4xl font-black tabular-nums">{recap.completed_cooks}</p>
						<p className="mt-1 text-sm text-muted-foreground">Across your personal cooking history</p>
					</Card>
					<Card as="article" className="p-5 sm:p-6">
						<p className="text-sm font-semibold text-muted-foreground">Recipes tried</p>
						<p className="mt-3 text-4xl font-black tabular-nums">{recap.unique_recipes}</p>
						<p className="mt-1 text-sm text-muted-foreground">Different recipes you have finished</p>
					</Card>
					<Card as="article" className="p-5 sm:p-6">
						<p className="text-sm font-semibold text-muted-foreground">Most cooked</p>
						{recap.most_cooked ? (
							<>
								<Link className="mt-3 block text-lg font-black leading-tight text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to={`/recipe?id=${recap.most_cooked.recipe_id}`}>{recap.most_cooked.recipe_name}</Link>
								<p className="mt-1 text-sm text-muted-foreground">Cooked {recap.most_cooked.cook_count} times</p>
							</>
						) : (
							<p className="mt-3 text-sm leading-6 text-muted-foreground">Your first finished recipe will start this list.</p>
						)}
					</Card>
				</div>
			) : null}
		</section>
	);
};

export default PersonalCookingRecap;
