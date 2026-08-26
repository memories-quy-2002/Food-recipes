import { useMemo, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { ChefHat, Plus, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { RecipeSummary } from "@/shared/api/contracts";
import { useSuggestionMutation } from "@/features/suggestions/api/suggestionsQueries";
import type { SuggestionResult } from "@/features/suggestions/api/suggestionsApi";
import RecipeCard from "@/shared/ui/RecipeCard";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import { Card } from "@/shared/ui/Card";

export const normalizeIngredient = (value: unknown): string =>
	typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

export const parseIngredientInput = (value: unknown): string[] =>
	typeof value === "string"
		? value.split(",").map(normalizeIngredient).filter(Boolean)
		: [];

export const addIngredientToken = (current: string[], value: unknown): string[] => {
	const next = normalizeIngredient(value);
	if (!next) return current;
	const exists = current.some((ingredient) => ingredient.toLocaleLowerCase() === next.toLocaleLowerCase());
	return exists ? current : [...current, next];
};

const MAX_PANTRY_INGREDIENTS = 10;

const toSuggestionRecipe = (suggestion: SuggestionResult): RecipeSummary => ({
	recipe_id: suggestion.recipe_id,
	recipe_name: suggestion.recipe_name,
	recipe_description: suggestion.recipe_description,
	date_added: null,
	image_url: suggestion.image_url,
	prep_time_minutes: 0,
	cook_time_minutes: 0,
	total_time_minutes: 0,
	user_id: 0,
});

const PantryMatchPanel = (): React.ReactElement => {
	const [ingredients, setIngredients] = useState<string[]>([]);
	const [input, setInput] = useState<string>("");
	const [validationMessage, setValidationMessage] = useState<string>("");
	const mutation = useSuggestionMutation();
	const suggestions = mutation.data?.suggestions ?? [];
	const resultMessage = useMemo(() => {
		if (mutation.isPending) return "Looking through the recipe catalog.";
		if (!mutation.data) return "Add a few ingredients to find recipes that use what you already have.";
		return suggestions.length
			? `${suggestions.length} matching recipes found.`
			: "No matching recipes found yet. Try a broader ingredient. ";
	}, [mutation.data, mutation.isPending, suggestions.length]);

	const addInputIngredients = (): void => {
		const nextIngredients = parseIngredientInput(input);
		if (!nextIngredients.length) return;
		const combinedIngredients = nextIngredients.reduce(addIngredientToken, ingredients);
		if (combinedIngredients.length > MAX_PANTRY_INGREDIENTS) {
			setValidationMessage(`Add up to ${MAX_PANTRY_INGREDIENTS} ingredients.`);
			return;
		}
		setIngredients(combinedIngredients);
		setInput("");
		setValidationMessage("");
	};

	const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
		if (event.key === "," || event.key === "Enter") {
			event.preventDefault();
			addInputIngredients();
		}
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		const nextIngredients = parseIngredientInput(input).reduce(addIngredientToken, ingredients);
		if (!nextIngredients.length) {
			setValidationMessage("Add at least one ingredient first.");
			return;
		}
		if (nextIngredients.length > MAX_PANTRY_INGREDIENTS) {
			setValidationMessage(`Add up to ${MAX_PANTRY_INGREDIENTS} ingredients.`);
			return;
		}
		setIngredients(nextIngredients);
		setInput("");
		setValidationMessage("");
		mutation.mutate({ intent: "ingredient_match", ingredients: nextIngredients });
	};

	return (
		<Card as="section" className="overflow-hidden border-foreground/15 bg-card shadow-md" aria-labelledby="pantry-match-title">
			<div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10 lg:p-9">
				<header>
					<div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"><ChefHat className="size-5" aria-hidden="true" /></div>
					<p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-primary">Pantry-first cooking</p>
					<h2 id="pantry-match-title" className="mt-2 max-w-md text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">Cook from what you have.</h2>
					<p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">Add the ingredients already in your kitchen. We’ll surface recipes that make them useful.</p>
				</header>

				<div>
					<form role="search" aria-labelledby="pantry-match-title" onSubmit={handleSubmit} className="grid gap-3">
						<label htmlFor="pantry-ingredient-input" className="text-sm font-black">What’s in your pantry?</label>
						<div className="flex flex-col gap-2 sm:flex-row">
							<Input id="pantry-ingredient-input" type="text" value={input} onChange={(event: ChangeEvent<HTMLInputElement>) => setInput(event.target.value)} onKeyDown={handleInputKeyDown} placeholder="e.g. chickpeas, lemon, spinach" aria-describedby="pantry-input-help pantry-validation-message" aria-invalid={Boolean(validationMessage)} maxLength={120} />
							<Button type="button" variant="outline" className="shrink-0" onClick={addInputIngredients} disabled={!input.trim() || ingredients.length >= MAX_PANTRY_INGREDIENTS}><Plus className="size-4" aria-hidden="true" />Add ingredient</Button>
						</div>
						<p id="pantry-input-help" className="text-xs text-muted-foreground">Press Enter or use commas to add more than one.</p>
						{ingredients.length ? <div className="flex flex-wrap gap-2" aria-label="Selected pantry ingredients">{ingredients.map((ingredient) => <span key={ingredient.toLocaleLowerCase()} className="inline-flex min-h-11 items-center gap-1 rounded-full bg-secondary px-3 text-sm font-bold text-secondary-foreground">{ingredient}<button type="button" className="grid size-11 place-items-center rounded-full hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setIngredients((current) => current.filter((item) => item !== ingredient))} aria-label={`Remove ${ingredient}`}><X className="size-4" aria-hidden="true" /></button></span>)}</div> : null}
						{validationMessage ? <p id="pantry-validation-message" className="text-sm font-bold text-destructive" role="alert">{validationMessage}</p> : <span id="pantry-validation-message" className="sr-only" />}
						<Button type="submit" className="w-full sm:w-fit" disabled={mutation.isPending}>{mutation.isPending ? "Finding matches…" : "Find matching recipes"}</Button>
					</form>

					<div className="mt-6" aria-live="polite" aria-atomic="true">
						<p className="text-sm font-bold text-foreground">{resultMessage}</p>
						{mutation.isError ? <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive" role="alert">Matching recipes are unavailable right now. Please try again.</p> : null}
					</div>
				</div>
			</div>

			{mutation.data ? <div className="border-t border-border bg-background/70 px-5 py-6 sm:px-7 lg:px-9"><div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Your matches</p><h3 className="mt-1 text-2xl font-black">Recipes to use next</h3></div><Link className="inline-flex min-h-11 items-center text-sm font-black text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to="/food">Browse the full index</Link></div>{suggestions.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{suggestions.map((suggestion) => <div key={suggestion.recipe_id}><RecipeCard recipe={toSuggestionRecipe(suggestion)} /><p className="px-1 pt-2 text-xs font-semibold leading-5 text-muted-foreground">{suggestion.reason}</p></div>)}</div> : <div className="rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">No recipe used those ingredients yet. Try adding a staple like rice, beans, or garlic.</div>}</div> : null}
		</Card>
	);
};

export default PantryMatchPanel;
