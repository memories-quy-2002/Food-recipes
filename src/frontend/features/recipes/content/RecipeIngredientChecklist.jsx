import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { formatStructuredIngredient } from "../structuredIngredients";
import { cn } from "@/shared/lib/utils";

const toIngredientText = (ingredient) => (
	typeof ingredient === "string" ? ingredient : formatStructuredIngredient(ingredient)
);

const toRecipeScope = (recipeIdentity) => String(recipeIdentity ?? "recipe").replace(/[^a-zA-Z0-9_-]/g, "-");

export const getIngredientSignature = (ingredients) => (ingredients || [])
	.map((ingredient, index) => `${index}:${toIngredientText(ingredient)}`)
	.join("|");

const RecipeIngredientChecklist = ({ recipeIdentity, ingredients }) => {
	const ingredientList = Array.isArray(ingredients) ? ingredients : [];
	const recipeScope = toRecipeScope(recipeIdentity);
	const ingredientSignature = getIngredientSignature(ingredientList);
	const [checkedIngredients, setCheckedIngredients] = useState(() => new Set());

	useEffect(() => {
		setCheckedIngredients(new Set());
	}, [recipeIdentity, ingredientSignature]);

	if (!ingredientList.length) {
		return <p className="text-sm text-muted-foreground">No ingredient information is available.</p>;
	}

	return (
		<div className="mt-5">
			<p className="text-sm leading-6 text-muted-foreground">
				Check ingredients as you gather them. Progress stays local to this page.
			</p>
			<ul className="mt-4 grid gap-2 sm:grid-cols-2" aria-label="Ingredients checklist">
				{ingredientList.map((ingredient, index) => {
					const text = toIngredientText(ingredient);
					const ingredientId = `${recipeScope}-ingredient-${index}`;
					const isChecked = checkedIngredients.has(index);

					return (
						<li key={ingredientId}>
							<label
								className={cn(
									"group flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-border bg-background px-3 py-3 text-sm leading-5 transition hover:border-primary/35 hover:bg-accent/50",
									isChecked && "border-primary/20 bg-muted text-muted-foreground"
								)}
								htmlFor={ingredientId}
							>
								<span className={cn(
									"mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-input bg-card transition",
									isChecked && "border-primary bg-primary text-primary-foreground"
								)}>
									{isChecked ? <Check className="size-3.5" aria-hidden="true" /> : null}
								</span>
								<input
									id={ingredientId}
									type="checkbox"
									className="sr-only"
									checked={isChecked}
									aria-label={`Mark ${text} as complete`}
									onChange={(event) => setCheckedIngredients((current) => {
										const next = new Set(current);
										if (event.target.checked) next.add(index);
										else next.delete(index);
										return next;
									})}
								/>
								<span className={cn("min-w-0", isChecked && "line-through decoration-primary/50")}>{text}</span>
							</label>
						</li>
					);
				})}
			</ul>
		</div>
	);
};

export default RecipeIngredientChecklist;
