import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MealPlanSlot } from './dto/add-meal-plan-item.dto';
import { ApplyMealPlanTemplateDto } from './dto/apply-meal-plan-template.dto';
import { CreateRecurringMealRuleDto } from './dto/create-recurring-meal-rule.dto';
import { SaveMealPlanTemplateDto } from './dto/save-meal-plan-template.dto';

export type SavedPlan = { id: number; name: string; start_date: Date | string; end_date: Date | string };
export type Template = { id: number; name: string; duration_days: number };
export type TemplateItem = { relative_day: number; recipe_id: number; slot: MealPlanSlot; servings: number };
export type PlanSourceItem = { recipe_id: number; planned_date: Date | string; slot: MealPlanSlot; servings: number };
export type RecurringRule = { id: number; weekday: number; slot: MealPlanSlot; recipe_id: number; servings: number };

export interface SavedPlanningRepositoryPort {
  createTemplate(userId: number, name: string, durationDays: number): Promise<Template>;
  createTemplateWithItems?(userId: number, name: string, durationDays: number, items: TemplateItem[]): Promise<Template>;
  listTemplates(userId: number): Promise<Template[]>;
  findTemplate(userId: number, templateId: number): Promise<Template | null>;
  findOwnedPlan(userId: number, planId: number): Promise<SavedPlan | null>;
  createTemplateItems(templateId: number, items: TemplateItem[]): Promise<void>;
  listTemplateItems(templateId: number): Promise<TemplateItem[]>;
  createPlanItemsFromTemplate(planId: number, items: Array<{ recipe_id: number; date: string; slot: MealPlanSlot; servings: number }>): Promise<number>;
  createRecurringRule(userId: number, dto: CreateRecurringMealRuleDto): Promise<RecurringRule>;
  listRecurringRules(userId: number): Promise<RecurringRule[]>;
  deleteRecurringRule(userId: number, ruleId: number): Promise<boolean>;
  recipeExists(recipeId: number): Promise<boolean>;
  listPlanItemsForTemplate(userId: number, planId: number): Promise<PlanSourceItem[]>;
}

export const SAVED_PLANNING_REPOSITORY = Symbol('SAVED_PLANNING_REPOSITORY');

@Injectable()
export class SavedPlanningService {
  constructor(@Inject(SAVED_PLANNING_REPOSITORY) private readonly repository: SavedPlanningRepositoryPort) {}

  async saveTemplate(userId: number, dto: SaveMealPlanTemplateDto) {
    const plan = await this.repository.findOwnedPlan(userId, dto.planId);
    if (!plan) throw this.planNotFound();
    const durationDays = this.daysBetween(this.dateText(plan.start_date), this.dateText(plan.end_date)) + 1;
    const items = await this.repository.listPlanItemsForTemplate(userId, dto.planId);
		const templateItems = items.map((item) => ({
      relative_day: this.daysBetween(this.dateText(plan.start_date), this.dateText(item.planned_date)),
      recipe_id: item.recipe_id,
      slot: item.slot,
      servings: item.servings,
    }));
		const template = this.repository.createTemplateWithItems
			? await this.repository.createTemplateWithItems(userId, dto.name?.trim() || plan.name, durationDays, templateItems)
			: await this.repository.createTemplate(userId, dto.name?.trim() || plan.name, durationDays);
		if (!this.repository.createTemplateWithItems) await this.repository.createTemplateItems(template.id, templateItems);
    return { template };
  }

  listTemplates(userId: number) { return this.repository.listTemplates(userId).then((templates) => ({ templates })); }

  async applyTemplate(userId: number, templateId: number, dto: ApplyMealPlanTemplateDto) {
    const [template, plan] = await Promise.all([
      this.repository.findTemplate(userId, templateId),
      this.repository.findOwnedPlan(userId, dto.planId),
    ]);
    if (!template) throw new NotFoundException({ code: 'MEAL_PLAN_TEMPLATE_NOT_FOUND', message: 'Meal plan template not found' });
    if (!plan) throw this.planNotFound();
    this.validateRange(dto.from, dto.to);
    if (this.parseDate(dto.from) < this.parseDate(this.dateText(plan.start_date)) || this.parseDate(dto.to) > this.parseDate(this.dateText(plan.end_date))) {
      throw new BadRequestException({ code: 'MEAL_PLAN_DATE_OUT_OF_RANGE', message: 'Applied dates must be inside the target meal plan range' });
    }
    const items = (await this.repository.listTemplateItems(templateId)).filter((item) => item.relative_day < this.daysBetween(dto.from, dto.to) + 1);
    const applied = await this.repository.createPlanItemsFromTemplate(dto.planId, items.map((item) => ({ recipe_id: item.recipe_id, date: this.addDays(dto.from, item.relative_day), slot: item.slot, servings: item.servings })));
    return { applied: applied ?? items.length, plan_id: dto.planId, from: dto.from, to: dto.to };
  }

  async createRecurringRule(userId: number, dto: CreateRecurringMealRuleDto) {
    if (!(await this.repository.recipeExists(dto.recipeId))) throw new NotFoundException({ code: 'RECIPE_NOT_FOUND', message: 'Recipe not found' });
    return { rule: await this.repository.createRecurringRule(userId, dto) };
  }

  listRecurringRules(userId: number) { return this.repository.listRecurringRules(userId).then((rules) => ({ rules })); }

  async deleteRecurringRule(userId: number, ruleId: number) {
    if (!(await this.repository.deleteRecurringRule(userId, ruleId))) throw new NotFoundException({ code: 'RECURRING_MEAL_RULE_NOT_FOUND', message: 'Recurring meal rule not found' });
    return { message: 'Recurring meal rule removed' };
  }

  private planNotFound() { return new NotFoundException({ code: 'MEAL_PLAN_NOT_FOUND', message: 'Meal plan not found' }); }
  private dateText(value: Date | string) { return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10); }
  private parseDate(value: string) { const date = new Date(`${value}T00:00:00.000Z`); if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new BadRequestException({ code: 'INVALID_DATE_RANGE', message: 'Invalid date range' }); return date; }
  private daysBetween(from: string, to: string) { return Math.round((this.parseDate(to).getTime() - this.parseDate(from).getTime()) / 86_400_000); }
  private validateRange(from: string, to: string) { const days = this.daysBetween(from, to) + 1; if (days < 1 || days > 31) throw new BadRequestException({ code: 'INVALID_DATE_RANGE', message: 'Date range must be between 1 and 31 days' }); }
  private addDays(from: string, offset: number) { const date = this.parseDate(from); date.setUTCDate(date.getUTCDate() + offset); return date.toISOString().slice(0, 10); }
}
