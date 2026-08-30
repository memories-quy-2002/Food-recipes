import { useState } from "react";
import { BookmarkPlus, Repeat2, Trash2 } from "lucide-react";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import { useAllRecipesQuery } from "@/features/recipes/api/useRecipeQueries";
import type { MealSlot } from "../api/planningApi";
import {
	useApplyMealPlanTemplateMutation,
	useCreateRecurringMealRuleMutation,
	useDeleteRecurringMealRuleMutation,
	useRecurringMealRulesQuery,
	useSaveMealPlanTemplateMutation,
} from "../api/savedPlanningQueries";
import { useQuery } from "@tanstack/react-query";
import { listMealPlanTemplates } from "../api/savedPlanningApi";

type SavedPlanningPanelProps = { planId?: number; from: string; to: string; canEdit: boolean };
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

const SavedPlanningPanel = ({ planId, from, to, canEdit }: SavedPlanningPanelProps) => {
	const templatesQuery = useQuery({ queryKey: ["planning", "templates"], queryFn: listMealPlanTemplates });
	const recurringQuery = useRecurringMealRulesQuery();
	const recipesQuery = useAllRecipesQuery();
	const saveTemplate = useSaveMealPlanTemplateMutation();
	const applyTemplate = useApplyMealPlanTemplateMutation();
	const createRule = useCreateRecurringMealRuleMutation();
	const deleteRule = useDeleteRecurringMealRuleMutation();
	const [recipeId, setRecipeId] = useState("");
	const [weekday, setWeekday] = useState(0);
	const [slot, setSlot] = useState<MealSlot>("dinner");
	const [servings, setServings] = useState(2);

	const handleSaveTemplate = (): void => {
		if (!planId || saveTemplate.isPending) return;
		const name = window.prompt("Name this meal plan", "My week");
		if (name === null) return;
		saveTemplate.mutate({ planId, name: name.trim() || "My week" });
	};

	const handleAddRule = (): void => {
		const selectedRecipeId = Number(recipeId);
		if (!selectedRecipeId || createRule.isPending) return;
		createRule.mutate({ weekday, slot, recipeId: selectedRecipeId, servings });
	};

	return (
		<section className="mt-5 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]" aria-labelledby="saved-planning-title">
			<div className="rounded-2xl border border-border bg-card p-5">
				<div className="flex items-start justify-between gap-3">
					<div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Reuse what works</p><h2 id="saved-planning-title" className="mt-1 text-xl font-black">Saved weeks</h2><p className="mt-1 text-sm text-muted-foreground">Save a good week once, then bring it back whenever you need it.</p></div>
					<Button variant="outline" size="sm" onClick={handleSaveTemplate} disabled={!planId || !canEdit || saveTemplate.isPending} title={!planId ? "Create a plan first" : "Save this week as a template"}><BookmarkPlus className="size-4" aria-hidden="true" />Save week</Button>
				</div>
				<div className="mt-4 grid gap-2">
					{templatesQuery.isPending ? <p className="text-sm text-muted-foreground" role="status">Loading saved weeks…</p> : templatesQuery.data?.templates.length ? templatesQuery.data.templates.map((template) => <div key={template.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-black">{template.name}</p><p className="text-xs text-muted-foreground">{template.duration_days} days</p></div><Button size="sm" onClick={() => planId && applyTemplate.mutate({ templateId: template.id, input: { planId, from, to } })} disabled={!planId || !canEdit || applyTemplate.isPending}>Use</Button></div>) : <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">No saved weeks yet. Save the current plan when it feels right.</p>}
				</div>
			</div>

			<div className="rounded-2xl border border-border bg-card p-5">
				<div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Make it automatic</p><h2 className="mt-1 text-xl font-black">Recurring meals</h2><p className="mt-1 text-sm text-muted-foreground">Keep reliable staples in your routine without rebuilding them each week.</p></div>
				<div className="mt-4 grid gap-2 sm:grid-cols-2">
					<select aria-label="Recurring recipe" className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm sm:col-span-2" value={recipeId} onChange={(event) => setRecipeId(event.target.value)} disabled={!canEdit || createRule.isPending}><option value="">Choose a recipe</option>{(recipesQuery.data ?? []).map((recipe) => <option key={recipe.recipe_id} value={recipe.recipe_id}>{recipe.recipe_name}</option>)}</select>
					<select aria-label="Recurring weekday" className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm" value={weekday} onChange={(event) => setWeekday(Number(event.target.value))} disabled={!canEdit || createRule.isPending}>{DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select>
					<select aria-label="Recurring meal" className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm" value={slot} onChange={(event) => setSlot(event.target.value as MealSlot)} disabled={!canEdit || createRule.isPending}>{SLOTS.map((mealSlot) => <option key={mealSlot} value={mealSlot}>{mealSlot[0].toUpperCase() + mealSlot.slice(1)}</option>)}</select>
					<Input aria-label="Recurring servings" type="number" min="1" max="24" value={servings} onChange={(event) => setServings(Number(event.target.value))} disabled={!canEdit || createRule.isPending} />
					<Button className="sm:col-span-2" onClick={handleAddRule} disabled={!canEdit || !recipeId || createRule.isPending}><Repeat2 className="size-4" aria-hidden="true" />Add recurring meal</Button>
				</div>
				<div className="mt-4 grid gap-2" aria-live="polite">
					{recurringQuery.isPending ? <p className="text-sm text-muted-foreground" role="status">Loading recurring meals…</p> : recurringQuery.data?.rules.length ? recurringQuery.data.rules.map((rule) => <div key={rule.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-3"><p className="min-w-0 truncate text-sm font-semibold"><span className="font-black">{DAYS[rule.weekday]} · {rule.slot}</span><span className="text-muted-foreground"> · {recipesQuery.data?.find((recipe) => recipe.recipe_id === rule.recipe_id)?.recipe_name ?? `Recipe #${rule.recipe_id}`} · {rule.servings} servings</span></p><button type="button" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-destructive hover:bg-destructive/10" aria-label={`Remove ${DAYS[rule.weekday]} recurring meal`} onClick={() => deleteRule.mutate(rule.id)} disabled={!canEdit || deleteRule.isPending}><Trash2 className="size-4" aria-hidden="true" /></button></div>) : <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">No recurring meals yet.</p>}
				</div>
			</div>
		</section>
	);
};

export default SavedPlanningPanel;
