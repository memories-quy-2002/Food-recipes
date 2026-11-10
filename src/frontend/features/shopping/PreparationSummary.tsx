import { ArrowRight, Check, CircleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { PrepareRecipeResponse } from "./api/shoppingApi";

export const getPreparationCounts = (result: PrepareRecipeResponse) => ({
	available: result.ingredients.filter((ingredient) => ingredient.status === "available").length,
	missing: result.ingredients.filter((ingredient) => ingredient.status === "missing").length,
	needsDetails: result.ingredients.filter((ingredient) => ingredient.status === "needs_details").length,
});

const PreparationSummary = ({ result, onAddMissing, isAdding = false, onPreviewServings, isPreviewing = false }: { result: PrepareRecipeResponse; onAddMissing?: () => void; isAdding?: boolean; onPreviewServings?: (servings: number) => void; isPreviewing?: boolean }) => {
	const counts = getPreparationCounts(result);
	const [servings, setServings] = useState(result.servings);
	const hasStalePreview = servings !== result.servings;

	useEffect(() => setServings(result.servings), [result.recipe_id, result.servings]);

	return (
		<section className="mt-5 rounded-2xl border border-primary/25 bg-primary/5 p-4" role="status" aria-live="polite" aria-label="Meal preparation status">
			<div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-black">
				<span className="inline-flex items-center gap-1.5 text-primary"><Check className="size-4" aria-hidden="true" />{counts.available} ready</span>
				<span>{counts.missing} to buy</span>
				{counts.needsDetails > 0 && <span className="inline-flex items-center gap-1.5 text-muted-foreground"><CircleAlert className="size-4" aria-hidden="true" />{counts.needsDetails} need details</span>}
			</div>
			<p className="mt-2 text-sm leading-6 text-muted-foreground">{result.shopping_list_confirmed ? result.added_shopping_items ? `${result.added_shopping_items} missing item${result.added_shopping_items === 1 ? "" : "s"} added to your shopping list.` : "Missing ingredients are already on your shopping list." : counts.needsDetails ? "Add quantities to ingredients marked as needing details before checking them against your pantry." : "Review what is missing, then choose whether to add it to your shopping list."}</p>
			{(counts.missing > 0 || counts.needsDetails > 0) && <div className="mt-3">
				<div className="flex flex-wrap items-end justify-between gap-3"><h3 className="text-sm font-black">For {result.servings} servings</h3>{onPreviewServings && <div className="flex flex-wrap items-end gap-2"><label className="grid gap-1 text-xs font-bold" htmlFor="preparation-servings">Servings<input id="preparation-servings" className="min-h-10 w-24 rounded-lg border border-input bg-background px-3 text-sm text-foreground" type="number" min="1" max="24" step="1" value={servings} onChange={(event) => setServings(Number(event.target.value))} /></label>{hasStalePreview && <button type="button" className="min-h-10 rounded-lg border border-primary px-3 py-2 text-xs font-black text-primary disabled:cursor-wait disabled:opacity-60" onClick={() => onPreviewServings(servings)} disabled={!Number.isInteger(servings) || servings < 1 || servings > 24 || isPreviewing} aria-busy={isPreviewing}>{isPreviewing ? "Updating…" : `Update preview for ${servings} servings`}</button>}</div>}</div>
				<ul className="mt-1 grid gap-1 text-sm leading-6 text-muted-foreground" aria-label="Ingredient amounts and details">
					{result.ingredients.filter((ingredient) => ingredient.status === "missing").map((ingredient) => <li key={ingredient.position} className="flex flex-wrap justify-between gap-x-4"><span>{ingredient.ingredient_name}</span><span className="font-bold text-foreground">{ingredient.missing_quantity ?? "Quantity unavailable"}{ingredient.required_unit ? ` ${ingredient.required_unit}` : ""}</span></li>)}
					{result.ingredients.filter((ingredient) => ingredient.status === "needs_details").map((ingredient) => <li key={ingredient.position} className="flex flex-wrap justify-between gap-x-4"><span>{ingredient.ingredient_name}</span><span className="font-bold text-foreground">Needs a quantity</span></li>)}
				</ul>
			</div>}
			{counts.missing > 0 && onAddMissing && !result.shopping_list_confirmed && <button type="button" className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-black text-primary-foreground hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60" onClick={onAddMissing} disabled={isAdding || hasStalePreview} aria-busy={isAdding}>{isAdding ? "Adding…" : "Add missing ingredients to shopping list"}</button>}
			{result.shopping_list_confirmed && <Link className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-black text-primary underline-offset-4 hover:underline" to="/shopping-list">Open shopping list <ArrowRight className="size-4" aria-hidden="true" /></Link>}
		</section>
	);
};

export default PreparationSummary;
