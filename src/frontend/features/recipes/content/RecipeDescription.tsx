import React, { useEffect, useMemo, useState } from "react";
import { Clock3, Minus, Plus, Users } from "lucide-react";
import type { RecipeDetail, RecipeNutrition, StructuredIngredient } from "@/shared/api/contracts";
import RecipeIngredientChecklist, { getIngredientSignature } from "./RecipeIngredientChecklist";
import { scaleStructuredIngredient } from "../structuredIngredients";
import { INGREDIENT_UNITS, type IngredientUnit } from "../structuredIngredients";
import Button from "@/shared/ui/Button";

const DEFAULT_SERVINGS = 4;
const MIN_SERVINGS = 1;
const MAX_SERVINGS = 99;

type ReadStructuredIngredient = StructuredIngredient & {
	note?: string | null;
	quantity_text?: string | null;
	preparation_text?: string | null;
};

type RecipeDescriptionRecipe = {
	recipe_name?: string;
	recipe_description?: string | null;
	recipe_id?: number;
	id?: number | string;
	publicId?: number | string;
	date_added?: string | null;
	servings?: number | string | null;
	serving_count?: number | string | null;
	yield?: number | string | null;
	recipe_yield?: number | string | null;
	recipeYield?: number | string | null;
	prepTimeMinutes?: unknown;
	cookTimeMinutes?: unknown;
	prepTime?: unknown;
	cookTime?: unknown;
	prep_time_minutes?: number | string | null;
	cook_time_minutes?: number | string | null;
	prep_time?: unknown;
	cook_time?: unknown;
	ingredients?: unknown[] | null;
	instructions?: unknown;
	structured_ingredients?: ReadStructuredIngredient[] | null;
	structuredIngredients?: ReadStructuredIngredient[] | null;
	metadata?: RecipeDetail["metadata"] | null;
	dietaryTags?: string[];
	allergenTags?: string[];
	dietary_tags?: string[];
	allergen_tags?: string[];
	nutrition?: RecipeNutrition | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const firstDefined = (recipe: RecipeDescriptionRecipe | null | undefined, fields: string[]): unknown => fields
	.map((field) => recipe?.[field as keyof RecipeDescriptionRecipe])
	.find((value) => value !== undefined && value !== null && value !== "");

const toMinutes = (value: unknown): number | null => {
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
	if (!isRecord(value)) return null;
	const days = Number(value.days ?? value.day ?? value.days_count ?? 0);
	const hours = Number(value.hours ?? value.hour ?? 0);
	const minutes = Number(value.minutes ?? value.minute ?? 0);
	const seconds = Number(value.seconds ?? value.second ?? 0);
	const total = days * 1440 + hours * 60 + minutes + seconds / 60;
	return [days, hours, minutes, seconds].every(Number.isFinite) && total >= 0 ? total : null;
};

export const normalizeRecipeTime = (recipe: RecipeDescriptionRecipe, kind: "prep" | "cook"): number | null =>
	toMinutes(firstDefined(recipe, [`${kind}TimeMinutes`, `${kind}_time_minutes`, `${kind}Time`, `${kind}_time`]));

export const formatRecipeDuration = (minutes: number | null | undefined): string => {
	if (minutes === null || minutes === undefined) return "Not provided";
	const totalMinutes = Math.round(minutes);
	if (totalMinutes < 60) return `${totalMinutes} min`;
	const hours = Math.floor(totalMinutes / 60);
	const remainder = totalMinutes % 60;
	return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
};

export const getRecipeTimeSummary = (recipe: RecipeDescriptionRecipe): { prep: number | null; cook: number | null; total: number | null } => {
	const prep = normalizeRecipeTime(recipe, "prep");
	const cook = normalizeRecipeTime(recipe, "cook");
	return { prep, cook, total: prep !== null && cook !== null ? prep + cook : null };
};

const getServings = (recipe: RecipeDescriptionRecipe): unknown => firstDefined(recipe, ["servings", "serving_count", "yield", "recipe_yield", "recipeYield"]) ?? recipe.nutrition?.servings;
const getRecipeIdentity = (recipe: RecipeDescriptionRecipe): number | string | undefined => {
	const identity = firstDefined(recipe, ["recipe_id", "id", "publicId"]);
	return typeof identity === "number" || typeof identity === "string" ? identity : undefined;
};
const normalizeInstructions = (instructions: unknown): Array<string | number> => Array.isArray(instructions)
	? instructions.filter((instruction): instruction is string | number => typeof instruction === "number" || (typeof instruction === "string" && instruction.trim().length > 0))
	: [];

export const normalizeServings = (value: unknown): number => {
	const numericValue = typeof value === "number" ? value : Number.parseFloat(String(value));
	if (!Number.isFinite(numericValue)) return DEFAULT_SERVINGS;
	return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, Math.round(numericValue)));
};

type SectionCardProps = {
	title: string;
	description?: string;
	descriptionRole?: React.AriaRole;
	children: React.ReactNode;
	id?: string;
	className?: string;
};

const SectionCard = ({ title, description, descriptionRole, children, id, className = "" }: SectionCardProps): React.ReactElement => (
	<section id={id} className={`rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7 lg:p-8 ${className}`}>
		<div className="max-w-3xl">
			<h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{title}</h2>
			{description ? <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base" role={descriptionRole}>{description}</p> : null}
		</div>
		{children}
	</section>
);

type RecipeDescriptionProps = {
	recipe: RecipeDescriptionRecipe;
};

const isIngredientUnit = (value: string): value is IngredientUnit =>
	INGREDIENT_UNITS.includes(value as IngredientUnit);

const isScalableIngredient = (
	ingredient: StructuredIngredient,
): ingredient is StructuredIngredient & { quantity: number; unit?: IngredientUnit } =>
	typeof ingredient.quantity === "number" &&
	Number.isFinite(ingredient.quantity) &&
	(ingredient.unit === undefined || (typeof ingredient.unit === "string" && isIngredientUnit(ingredient.unit)));

const RecipeDescription = ({ recipe }: RecipeDescriptionProps): React.ReactElement => {
	const { prep, cook, total } = getRecipeTimeSummary(recipe);
	const instructions = normalizeInstructions(recipe.instructions);
	const [servings, setServings] = useState(() => normalizeServings(getServings(recipe)));
	const recipeIdentity = getRecipeIdentity(recipe);
	const baseServings = normalizeServings(getServings(recipe));
	const structuredIngredients = useMemo(
		() => (Array.isArray(recipe.structured_ingredients)
			? recipe.structured_ingredients
			: Array.isArray(recipe.structuredIngredients) ? recipe.structuredIngredients : []),
		[recipe.structured_ingredients, recipe.structuredIngredients]
	);
	const displayedIngredients = structuredIngredients.length > 0
		? structuredIngredients.map((ingredient) => isScalableIngredient(ingredient)
			? scaleStructuredIngredient(ingredient, servings, baseServings)
			: ingredient)
		: recipe.ingredients;

	useEffect(() => {
		setServings(normalizeServings(getServings(recipe)));
		// Reset only when the displayed recipe changes; do not clobber a user's serving adjustment on re-render.
	}, [recipeIdentity]);

	const adjustServings = (amount: number): void => setServings((current) => {
		if ((current === MIN_SERVINGS && amount < 0) || (current === MAX_SERVINGS && amount > 0)) return current;
		return normalizeServings(current + amount);
	});

	const timing: Array<[string, number | null]> = [["Prep", prep], ["Cook", cook], ["Total", total]];
	const nutrition = recipe.nutrition;
	const nutritionItems: Array<[string, keyof RecipeNutrition, string]> = nutrition
		? ([
			["Calories", "calories", "calories"], ["Protein", "protein", "g protein"], ["Carbohydrates", "carbohydrates", "g carbs"], ["Fat", "fat", "g fat"], ["Fiber", "fiber", "g fiber"], ["Sugar", "sugar", "g sugar"], ["Sodium", "sodium", "mg sodium"],
		] as Array<[string, keyof RecipeNutrition, string]>)
			.filter(([, key]) => nutrition[key] !== null && nutrition[key] !== undefined)
		: [];
	const dietaryTags = recipe.dietaryTags || recipe.dietary_tags || [];
	const allergenTags = recipe.allergenTags || recipe.allergen_tags || [];
	const hasManualNutrition = Boolean(nutrition && !recipe.metadata && nutritionItems.length > 0);
	const hasDietaryInformation = dietaryTags.length > 0 || allergenTags.length > 0;

	return (
		<div className="space-y-6">
			<section data-recipe-section="decision-strip" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Recipe timing and servings">
				{timing.map(([label, value]) => (
					<div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
						<div className="flex items-center gap-2 text-muted-foreground"><Clock3 className="size-4" aria-hidden="true" /><span className="text-xs font-extrabold uppercase tracking-[0.14em]">{label}</span></div>
						<p className="mt-2 text-xl font-black text-foreground">{formatRecipeDuration(value)}</p>
					</div>
				))}
				<div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
					<div className="flex items-center gap-2 text-muted-foreground"><Users className="size-4" aria-hidden="true" /><span className="text-xs font-extrabold uppercase tracking-[0.14em]">Servings</span></div>
					<div className="mt-2 flex items-center gap-2" aria-label="Adjust servings">
						<Button variant="outline" size="icon" className="size-11 rounded-full" aria-label="Decrease servings" onClick={() => adjustServings(-1)} disabled={servings === MIN_SERVINGS}><Minus className="size-4" aria-hidden="true" /></Button>
						<span className="min-w-10 text-center text-xl font-black" aria-live="polite">{servings}</span>
						<Button variant="outline" size="icon" className="size-11 rounded-full" aria-label="Increase servings" onClick={() => adjustServings(1)} disabled={servings === MAX_SERVINGS}><Plus className="size-4" aria-hidden="true" /></Button>
					</div>
				</div>
			</section>

			<SectionCard title="About">
				<p className="mt-4 max-w-4xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
					{recipe.recipe_description ?? "There is no description for this recipe."}
				</p>
			</SectionCard>

			<div data-recipe-section="cooking-core" className="grid gap-6 lg:grid-cols-2 lg:items-start">
				<SectionCard
					id="ingredients"
					title="Ingredients"
					descriptionRole="note"
					description={structuredIngredients.length > 0
						? "Quantities are scaled with your serving count. Free-text notes stay exactly as written."
						: "Ingredients are shown as written because this recipe has unsupported ingredient data for automatic scaling."}
				>
					<RecipeIngredientChecklist
						key={`${recipeIdentity ?? "recipe"}:${getIngredientSignature(displayedIngredients)}`}
						recipeIdentity={recipeIdentity}
						ingredients={displayedIngredients}
					/>
				</SectionCard>

				<SectionCard id="instructions" title="Instructions" description="Work through one step at a time. You can switch to Cooking Mode from the recipe hero for a focused view.">
					{instructions.length > 0 ? (
						<ol className="mt-6 space-y-3">
							{instructions.map((instruction, index) => (
									<li className="grid grid-cols-[2.75rem_1fr] gap-3 rounded-2xl border border-border bg-background p-4 sm:grid-cols-[3rem_1fr] sm:p-5" key={`${index}-${instruction}`}>
										<span className="flex size-11 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground sm:size-12">{index + 1}</span>
									<p className="self-center text-base leading-7 text-foreground sm:text-lg">{instruction}</p>
									</li>
							))}
						</ol>
					) : <p className="mt-4 text-sm text-muted-foreground" role="status">No instructions are available yet.</p>}
				</SectionCard>
			</div>

			{hasManualNutrition || hasDietaryInformation ? (
				<section id="nutrition" data-recipe-section="nutrition-dietary" className="grid gap-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7 lg:grid-cols-2 lg:p-8" aria-label="Nutrition and dietary information">
					{hasManualNutrition ? (
						<div>
							<h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Nutrition per serving</h2>
							<p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">Manual values provided by the recipe author.</p>
							<ul className="mt-5 grid gap-2 sm:grid-cols-2" aria-label="Nutrition facts">
								{nutritionItems.map(([label, key, suffix]) => (
									<li key={key} className="rounded-xl bg-muted px-4 py-3 text-sm"><strong className="font-black">{label}</strong><span className="ml-2 text-muted-foreground">{nutrition?.[key]} {key === "calories" ? "calories" : suffix}</span></li>
								))}
							</ul>
						</div>
					) : null}

					{hasDietaryInformation ? (
						<div>
							<h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Dietary preferences</h2>
							{dietaryTags.length > 0 ? <div className="mt-4 flex flex-wrap gap-2">{dietaryTags.map((tag) => <span key={`dietary-${tag}`} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground">{tag}</span>)}</div> : null}
							{allergenTags.length > 0 ? <p className="mt-4 rounded-xl border border-accent/50 bg-accent/20 px-4 py-3 text-sm font-semibold text-foreground"><strong>Contains:</strong> {allergenTags.join(", ")}</p> : null}
						</div>
					) : null}
				</section>
			) : null}
		</div>
	);
};

export default RecipeDescription;
