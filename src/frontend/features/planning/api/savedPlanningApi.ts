import axios from "@/shared/api/axios";
import { apiRoutes } from "@/shared/api/routes";
import type { MealSlot } from "./planningApi";

export type MealPlanTemplate = { id: number; name: string; duration_days: number };
export type RecurringMealRule = { id: number; weekday: number; slot: MealSlot; recipe_id: number; servings: number };
export type SaveMealPlanTemplateInput = { planId: number; name?: string };
export type ApplyMealPlanTemplateInput = { planId: number; from: string; to: string };
export type CreateRecurringMealRuleInput = { weekday: number; slot: MealSlot; recipeId: number; servings: number };

export const listMealPlanTemplates = async (): Promise<{ templates: MealPlanTemplate[] }> =>
	(await axios.get<{ templates: MealPlanTemplate[] }>(apiRoutes.mealPlanTemplates)).data;

export const saveMealPlanTemplate = async (input: SaveMealPlanTemplateInput): Promise<{ template: MealPlanTemplate }> =>
	(await axios.post<{ template: MealPlanTemplate }>(apiRoutes.mealPlanTemplates, input)).data;

export const applyMealPlanTemplate = async (templateId: number, input: ApplyMealPlanTemplateInput): Promise<{ applied: number; plan_id: number; from: string; to: string }> =>
	(await axios.post<{ applied: number; plan_id: number; from: string; to: string }>(apiRoutes.mealPlanTemplateApply(templateId), input)).data;

export const listRecurringMealRules = async (): Promise<{ rules: RecurringMealRule[] }> =>
	(await axios.get<{ rules: RecurringMealRule[] }>(apiRoutes.recurringMealRules)).data;

export const createRecurringMealRule = async (input: CreateRecurringMealRuleInput): Promise<{ rule: RecurringMealRule }> =>
	(await axios.post<{ rule: RecurringMealRule }>(apiRoutes.recurringMealRules, input)).data;

export const deleteRecurringMealRule = async (ruleId: number): Promise<void> => {
	await axios.delete(apiRoutes.recurringMealRule(ruleId));
};
