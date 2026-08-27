import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { isAxiosError } from "axios";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import { Card } from "@/shared/ui/Card";
import { useSuggestionMutation } from "./api/suggestionsQueries";
import type { SuggestionIntent } from "./api/suggestionsApi";

const PRIVATE_MODES: ReadonlySet<SuggestionIntent> = new Set(["personalized", "meal_plan"]);
const modeOptions: Array<{ value: SuggestionIntent; label: string }> = [
	{ value: "ingredient_match", label: "What can I cook?" },
	{ value: "personalized", label: "Based on my ratings" },
	{ value: "meal_plan", label: "Fit my meal plan" },
	{ value: "substitution", label: "Compare an ingredient" },
];

type SuggestionPanelProps = {
	mode?: SuggestionIntent;
	recipeId?: number;
	isAuthenticated?: boolean;
	allowPersonalized?: boolean;
};

const isSuggestionIntent = (value: string): value is SuggestionIntent =>
	modeOptions.some((option) => option.value === value);

const SuggestionPanel = ({ mode = "ingredient_match", recipeId, isAuthenticated = false, allowPersonalized = false }: SuggestionPanelProps): ReactElement => {
	const [selectedMode, setSelectedMode] = useState(mode);
	const [ingredientText, setIngredientText] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const mutation = useSuggestionMutation();
	const isPrivateMode = PRIVATE_MODES.has(selectedMode);
	const inputLabel = selectedMode === "substitution" ? "Ingredient to compare" : "Ingredients to search";
	const inputId = useMemo(() => `suggestion-${selectedMode}-input`, [selectedMode]);

	const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault(); setErrorMessage("");
		if (isPrivateMode && !isAuthenticated) return setErrorMessage("Sign in to use personalized suggestions.");
		const trimmed = ingredientText.trim();
		const input = selectedMode === "ingredient_match" ? { intent: selectedMode, ingredients: trimmed.split(",").map((value) => value.trim()).filter(Boolean) } : selectedMode === "substitution" ? { intent: selectedMode, recipeId: Number(recipeId), ingredient: trimmed } : { intent: selectedMode };
		mutation.mutate(input, { onError: (error: unknown) => setErrorMessage(getApiErrorMessage(error)) });
	};

	const getApiErrorMessage = (error: unknown): string => {
		if (!isAxiosError(error)) return "Suggestions could not load. Try again.";
		const data = error.response?.data;
		return typeof data === "object" && data !== null && "message" in data && typeof data.message === "string" ? data.message : "Suggestions could not load. Try again.";
	};

	const data = mutation.data;
	return <Card as="section" className="w-full overflow-hidden p-5 sm:p-6 lg:p-8" aria-labelledby="suggestion-panel-title">
		<div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
			<header><div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary"><Sparkles className="size-5" aria-hidden="true" /></div><h2 id="suggestion-panel-title" className="text-3xl font-black tracking-tight">Recipe suggestions</h2><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Read-only ideas from your catalog. Nothing changes automatically.</p></header>
			<div>
		<form onSubmit={handleSubmit} className="grid gap-4"><div className="grid gap-4 sm:grid-cols-2">{allowPersonalized && <label className="grid gap-2 text-sm font-bold">Suggestion type<select aria-label="Suggestion type" className="min-h-12 rounded-xl border border-input bg-background px-4 py-2.5 text-base leading-6 outline-none transition focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 sm:text-sm" value={selectedMode} onChange={(event: ChangeEvent<HTMLSelectElement>) => { if (isSuggestionIntent(event.target.value)) setSelectedMode(event.target.value); setIngredientText(""); setErrorMessage(""); }}>{modeOptions.filter(({ value }) => value !== "substitution" || recipeId).map(({ value, label }) => <option key={value} value={value} disabled={PRIVATE_MODES.has(value) && !isAuthenticated}>{label}</option>)}</select></label>}{!isPrivateMode && <label htmlFor={inputId} className="grid gap-2 text-sm font-bold">{inputLabel}<Input id={inputId} value={ingredientText} onChange={(event: ChangeEvent<HTMLInputElement>) => setIngredientText(event.target.value)} placeholder={selectedMode === "substitution" ? "e.g. milk" : "e.g. chicken, onion"} maxLength={selectedMode === "substitution" ? 80 : 800} /></label>}</div><Button type="submit" className="w-full sm:w-fit" disabled={mutation.isPending}>{mutation.isPending ? "Finding ideas…" : "Find suggestions"}</Button></form>
				{errorMessage && <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive" role="alert">{errorMessage}</p>}
				{data && <div className="mt-5 border-t border-border pt-5"><p className="rounded-xl bg-secondary p-3 text-sm leading-6 text-secondary-foreground" role="status">{data.disclaimer}</p><p className="mt-2 text-xs text-muted-foreground">Source: existing catalog data ({data.source}).</p>{data.suggestions.length ? <ul className="mt-4 grid gap-2">{data.suggestions.map((suggestion) => <li key={suggestion.recipe_id} className="rounded-xl border border-border bg-background p-3"><Link className="font-black text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to={`/recipe?id=${suggestion.recipe_id}`}>{suggestion.recipe_name}</Link><span className="mt-1 block text-sm leading-6 text-muted-foreground">{suggestion.reason}</span></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground" role="status">No matching recipes were found.</p>}</div>}
			</div>
		</div>
	</Card>;
};
export default SuggestionPanel;
