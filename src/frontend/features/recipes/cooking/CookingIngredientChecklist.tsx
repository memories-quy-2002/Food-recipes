import { useEffect, useState, type ReactElement } from "react";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { formatStructuredIngredient } from "../structuredIngredients";
import { readCookingToolsState, writeCookingToolsState } from "./cookingToolsStorage";

type CookingIngredientChecklistProps = {
	ingredients?: unknown[] | null;
	storageKey: string | null;
};

const ingredientText = (ingredient: unknown): string =>
	typeof ingredient === "string" ? ingredient : formatStructuredIngredient(ingredient);

const CookingIngredientChecklist = ({ ingredients, storageKey }: CookingIngredientChecklistProps): ReactElement | null => {
	const ingredientList = Array.isArray(ingredients) ? ingredients : [];
	const [checkedIngredients, setCheckedIngredients] = useState<number[]>(() => readCookingToolsState(storageKey).checkedIngredients);

	useEffect(() => {
		setCheckedIngredients(readCookingToolsState(storageKey).checkedIngredients.filter((index) => index < ingredientList.length));
	}, [ingredientList.length, storageKey]);

	const toggleIngredient = (index: number, checked: boolean): void => {
		setCheckedIngredients((current) => {
			const next = checked ? [...new Set([...current, index])] : current.filter((value) => value !== index);
			const state = readCookingToolsState(storageKey);
			writeCookingToolsState(storageKey, { ...state, checkedIngredients: next });
			return next;
		});
	};

	if (!ingredientList.length) return null;

	return (
		<section className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="cooking-ingredients-title">
			<div>
				<p className="text-xs font-black uppercase tracking-[0.14em] text-primary">Before this step</p>
				<h2 id="cooking-ingredients-title" className="mt-1 text-lg font-black">Ingredients checklist</h2>
				<p className="mt-1 text-sm text-muted-foreground">Check ingredients as you gather them. Your checklist comes back when you resume.</p>
			</div>
			<ul className="mt-4 grid gap-2 sm:grid-cols-2" aria-label="Cooking ingredients checklist">
				{ingredientList.map((ingredient, index) => {
					const text = ingredientText(ingredient);
					const id = `cooking-ingredient-${index}`;
					const checked = checkedIngredients.includes(index);
					return (
						<li key={id}>
							<label className={cn("flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-border bg-background px-3 py-3 text-sm leading-5 transition hover:border-primary/40", checked && "border-primary/20 bg-muted text-muted-foreground")} htmlFor={id}>
								<span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-input bg-card", checked && "border-primary bg-primary text-primary-foreground")} aria-hidden="true">{checked ? <Check className="size-3.5" /> : null}</span>
								<input id={id} type="checkbox" className="sr-only" checked={checked} onChange={(event) => toggleIngredient(index, event.target.checked)} aria-label={`Mark ${text} as ready`} />
								<span className={cn("min-w-0", checked && "line-through decoration-primary/50")}>{text}</span>
							</label>
						</li>
					);
				})}
			</ul>
		</section>
	);
};

export default CookingIngredientChecklist;
