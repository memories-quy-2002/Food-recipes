import React, { useEffect, useMemo, useState } from "react";
import { Clock3, Minus, Plus, Users } from "lucide-react";
import RecipeIngredientChecklist, { getIngredientSignature } from "./RecipeIngredientChecklist";
import { scaleStructuredIngredient } from "../structuredIngredients";
import Button from "@/shared/ui/Button";

const DEFAULT_SERVINGS = 4;
const MIN_SERVINGS = 1;
const MAX_SERVINGS = 99;

const firstDefined = (recipe, fields) => fields
	.map((field) => recipe?.[field])
	.find((value) => value !== undefined && value !== null && value !== "");

const toMinutes = (value) => {
	if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
	if (typeof value === "string") {
		const text = value.trim();
		if (!text) return null;
		if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text);
		const iso = text.match(/^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
		if (iso) return Number(iso[1] || 0) * 1440 + Number(iso[2] || 0) * 60 + Number(iso[3] || 0) + Number(iso[4] || 0) / 60;
		const clock = text.match(/^(?:(\d+)\s+days?\s+)?(\d+):(\d{2})(?::(\d{2}))?$/i);
		if (clock) return Number(clock[1] || 0) * 1440 + Number(clock[2]) * 60 + Number(clock[3]) + Number(clock[4] || 0) / 60;
		return null;
	}
	if (typeof value !== "object") return null;
	const days = Number(value.days ?? value.day ?? value.days_count ?? 0);
	const hours = Number(value.hours ?? value.hour ?? 0);
	const minutes = Number(value.minutes ?? value.minute ?? 0);
	const seconds = Number(value.seconds ?? value.second ?? 0);
	const total = days * 1440 + hours * 60 + minutes + seconds / 60;
	return [days, hours, minutes, seconds].every(Number.isFinite) && total >= 0 ? total : null;
};

export const normalizeRecipeTime = (recipe, kind) =>
	toMinutes(firstDefined(recipe, [`${kind}TimeMinutes`, `${kind}_time_minutes`, `${kind}Time`, `${kind}_time`]));

export const formatRecipeDuration = (minutes) => {
	if (minutes === null || minutes === undefined) return "Not provided";
	const totalMinutes = Math.round(minutes);
	if (totalMinutes < 60) return `${totalMinutes} min`;
	const hours = Math.floor(totalMinutes / 60);
	const remainder = totalMinutes % 60;
	return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
};

export const getRecipeTimeSummary = (recipe) => {
	const prep = normalizeRecipeTime(recipe, "prep");
	const cook = normalizeRecipeTime(recipe, "cook");
	return { prep, cook, total: prep !== null && cook !== null ? prep + cook : null };
};

const getServings = (recipe) => firstDefined(recipe, ["servings", "serving_count", "yield", "recipe_yield", "recipeYield"]) ?? recipe?.nutrition?.servings;
const getRecipeIdentity = (recipe) => firstDefined(recipe, ["recipe_id", "id", "publicId"]);
const normalizeInstructions = (instructions) => Array.isArray(instructions)
	? instructions.filter((instruction) => instruction !== null && instruction !== undefined && (typeof instruction !== "string" || instruction.trim().length > 0))
	: [];

export const normalizeServings = (value) => {
	const numericValue = typeof value === "number" ? value : Number.parseFloat(value);
	if (!Number.isFinite(numericValue)) return DEFAULT_SERVINGS;
	return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, Math.round(numericValue)));
};

const SectionCard = ({ title, description, children, id }) => (
	<section id={id} className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7 lg:p-8">
		<div className="max-w-3xl">
			<h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{title}</h2>
			{description ? <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{description}</p> : null}
		</div>
		{children}
	</section>
);

const RecipeDescription = ({ recipe }) => {
	const { prep, cook, total } = getRecipeTimeSummary(recipe);
	const instructions = normalizeInstructions(recipe.instructions);
	const [servings, setServings] = useState(() => normalizeServings(getServings(recipe)));
	const recipeIdentity = getRecipeIdentity(recipe);
	const baseServings = normalizeServings(getServings(recipe));
	const structuredIngredients = useMemo(
		() => (Array.isArray(recipe.structured_ingredients) ? recipe.structured_ingredients : []),
		[recipe.structured_ingredients]
	);
	const displayedIngredients = structuredIngredients.length > 0
		? structuredIngredients.map((ingredient) => scaleStructuredIngredient(ingredient, servings, baseServings))
		: recipe.ingredients;

	useEffect(() => {
		setServings(normalizeServings(getServings(recipe)));
		// Reset only when the displayed recipe changes; do not clobber a user's serving adjustment on re-render.
	}, [recipeIdentity]);

	const adjustServings = (amount) => setServings((current) => {
		if ((current === MIN_SERVINGS && amount < 0) || (current === MAX_SERVINGS && amount > 0)) return current;
		return normalizeServings(current + amount);
	});

	const timing = [["Prep", prep], ["Cook", cook], ["Total", total]];
	const nutritionItems = recipe.nutrition
		? [["Calories", "calories", "calories"], ["Protein", "protein", "g protein"], ["Carbohydrates", "carbohydrates", "g carbs"], ["Fat", "fat", "g fat"], ["Fiber", "fiber", "g fiber"], ["Sugar", "sugar", "g sugar"], ["Sodium", "sodium", "mg sodium"]]
			.filter(([, key]) => recipe.nutrition[key] !== null && recipe.nutrition[key] !== undefined)
		: [];
	const dietaryTags = recipe.dietaryTags || recipe.dietary_tags || [];
	const allergenTags = recipe.allergenTags || recipe.allergen_tags || [];

	return (
		<div className="space-y-6">
			<section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Recipe timing and servings">
				{timing.map(([label, value]) => (
					<div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
						<div className="flex items-center gap-2 text-muted-foreground"><Clock3 className="size-4" aria-hidden="true" /><span className="text-xs font-extrabold uppercase tracking-[0.14em]">{label}</span></div>
						<p className="mt-2 text-xl font-black text-foreground">{formatRecipeDuration(value)}</p>
					</div>
				))}
				<div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
					<div className="flex items-center gap-2 text-muted-foreground"><Users className="size-4" aria-hidden="true" /><span className="text-xs font-extrabold uppercase tracking-[0.14em]">Servings</span></div>
					<div className="mt-2 flex items-center gap-2" aria-label="Adjust servings">
						<Button variant="outline" size="icon" className="size-10 rounded-full" aria-label="Decrease servings" onClick={() => adjustServings(-1)} disabled={servings === MIN_SERVINGS}><Minus className="size-4" aria-hidden="true" /></Button>
						<span className="min-w-10 text-center text-xl font-black" aria-live="polite">{servings}</span>
						<Button variant="outline" size="icon" className="size-10 rounded-full" aria-label="Increase servings" onClick={() => adjustServings(1)} disabled={servings === MAX_SERVINGS}><Plus className="size-4" aria-hidden="true" /></Button>
					</div>
				</div>
			</section>

			<SectionCard title="About">
				<p className="mt-4 max-w-4xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
					{recipe.recipe_description ?? "There is no description for this recipe."}
				</p>
			</SectionCard>

			<SectionCard
				id="ingredients"
				title="Ingredients"
				description={structuredIngredients.length > 0
					? "Quantities update with your serving count. Free-text notes stay exactly as written."
					: "Ingredients are shown as written because automatic scaling is unavailable for this recipe."}
			>
				<RecipeIngredientChecklist
					key={`${recipeIdentity ?? "recipe"}:${getIngredientSignature(displayedIngredients)}`}
					recipeIdentity={recipeIdentity}
					ingredients={displayedIngredients}
				/>
			</SectionCard>

			{recipe.nutrition && !recipe.metadata && nutritionItems.length > 0 ? (
				<SectionCard title="Nutrition per serving" description="Manual values provided by the recipe author.">
					<ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Nutrition facts">
						{nutritionItems.map(([label, key, suffix]) => (
							<li key={key} className="rounded-xl bg-muted px-4 py-3 text-sm"><strong className="font-black">{label}</strong><span className="ml-2 text-muted-foreground">{recipe.nutrition[key]} {key === "calories" ? "calories" : suffix}</span></li>
						))}
					</ul>
				</SectionCard>
			) : null}

			{dietaryTags.length > 0 || allergenTags.length > 0 ? (
				<SectionCard title="Dietary preferences">
					{dietaryTags.length > 0 ? <div className="mt-4 flex flex-wrap gap-2">{dietaryTags.map((tag) => <span key={`dietary-${tag}`} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground">{tag}</span>)}</div> : null}
					{allergenTags.length > 0 ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950"><strong>Contains:</strong> {allergenTags.join(", ")}</p> : null}
				</SectionCard>
			) : null}

			<SectionCard title="Instructions" description="Work through one step at a time. You can switch to Cooking Mode from the recipe hero for a focused view.">
				{instructions.length > 0 ? (
					<ol className="mt-6 space-y-3">
						{instructions.map((instruction, index) => (
							<li className="grid grid-cols-[2.5rem_1fr] gap-3 rounded-2xl border border-border bg-background p-4 sm:grid-cols-[3rem_1fr] sm:p-5" key={`${index}-${instruction}`}>
								<span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground sm:size-12">{index + 1}</span>
								<p className="self-center text-base leading-7 text-foreground sm:text-lg">{instruction}</p>
							</li>
						))}
					</ol>
				) : <p className="mt-4 text-sm text-muted-foreground" role="status">No instructions are available yet.</p>}
			</SectionCard>
		</div>
	);
};

export default RecipeDescription;
