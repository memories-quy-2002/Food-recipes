import { ArrowRight, Check, CircleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import type { PrepareRecipeResponse } from "./api/shoppingApi";

export const getPreparationCounts = (result: PrepareRecipeResponse) => ({
	available: result.ingredients.filter((ingredient) => ingredient.status === "available").length,
	missing: result.ingredients.filter((ingredient) => ingredient.status === "missing").length,
	needsDetails: result.ingredients.filter((ingredient) => ingredient.status === "needs_details").length,
});

const PreparationSummary = ({ result }: { result: PrepareRecipeResponse }) => {
	const counts = getPreparationCounts(result);

	return (
		<section className="mt-5 rounded-2xl border border-primary/25 bg-primary/5 p-4" role="status" aria-live="polite" aria-label="Meal preparation status">
			<div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-black">
				<span className="inline-flex items-center gap-1.5 text-primary"><Check className="size-4" aria-hidden="true" />{counts.available} ready</span>
				<span>{counts.missing} to buy</span>
				{counts.needsDetails > 0 && <span className="inline-flex items-center gap-1.5 text-muted-foreground"><CircleAlert className="size-4" aria-hidden="true" />{counts.needsDetails} need details</span>}
			</div>
			<p className="mt-2 text-sm leading-6 text-muted-foreground">{result.added_shopping_items ? `${result.added_shopping_items} missing item${result.added_shopping_items === 1 ? "" : "s"} added to your shopping list.` : "Your pantry already covers everything we can measure."}</p>
			{result.added_shopping_items > 0 && <Link className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-black text-primary underline-offset-4 hover:underline" to="/shopping-list">Open shopping list <ArrowRight className="size-4" aria-hidden="true" /></Link>}
		</section>
	);
};

export default PreparationSummary;
