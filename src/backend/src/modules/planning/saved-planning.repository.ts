import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateRecurringMealRuleDto } from './dto/create-recurring-meal-rule.dto';
import { MealPlanSlot } from './dto/add-meal-plan-item.dto';
import { PlanSourceItem, RecurringRule, SavedPlan, SavedPlanningRepositoryPort, Template, TemplateItem } from './saved-planning.service';

@Injectable()
export class SavedPlanningRepository implements SavedPlanningRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}
  async createTemplateWithItems(userId: number, name: string, durationDays: number, items: TemplateItem[]): Promise<Template> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Template[]>(Prisma.sql`INSERT INTO meal_plan_templates (user_id, name, duration_days) VALUES (${userId}, ${name}, ${durationDays}) RETURNING template_id AS id, name, duration_days`);
      const template = rows[0];
      for (const item of items) await tx.$executeRaw(Prisma.sql`INSERT INTO meal_plan_template_items (template_id, relative_day, recipe_id, slot, servings) VALUES (${template.id}, ${item.relative_day}, ${item.recipe_id}, ${item.slot}, ${item.servings})`);
      return template;
    });
  }
  async createTemplate(userId: number, name: string, durationDays: number): Promise<Template> { const rows = await this.prisma.$queryRaw<Template[]>(Prisma.sql`INSERT INTO meal_plan_templates (user_id, name, duration_days) VALUES (${userId}, ${name}, ${durationDays}) RETURNING template_id AS id, name, duration_days`); return rows[0]; }
  listTemplates(userId: number): Promise<Template[]> { return this.prisma.$queryRaw<Template[]>(Prisma.sql`SELECT template_id AS id, name, duration_days FROM meal_plan_templates WHERE user_id = ${userId} ORDER BY created_at DESC, template_id DESC`); }
  async findTemplate(userId: number, templateId: number): Promise<Template | null> { const rows = await this.prisma.$queryRaw<Template[]>(Prisma.sql`SELECT template_id AS id, name, duration_days FROM meal_plan_templates WHERE user_id = ${userId} AND template_id = ${templateId}`); return rows[0] ?? null; }
  async findOwnedPlan(userId: number, planId: number): Promise<SavedPlan | null> { const rows = await this.prisma.$queryRaw<SavedPlan[]>(Prisma.sql`SELECT plan_id AS id, name, start_date, end_date FROM meal_plans WHERE user_id = ${userId} AND plan_id = ${planId}`); return rows[0] ?? null; }
  async createTemplateItems(templateId: number, items: TemplateItem[]): Promise<void> { for (const item of items) await this.prisma.$executeRaw(Prisma.sql`INSERT INTO meal_plan_template_items (template_id, relative_day, recipe_id, slot, servings) VALUES (${templateId}, ${item.relative_day}, ${item.recipe_id}, ${item.slot}, ${item.servings})`); }
  listTemplateItems(templateId: number): Promise<TemplateItem[]> { return this.prisma.$queryRaw<TemplateItem[]>(Prisma.sql`SELECT relative_day, recipe_id, slot, servings FROM meal_plan_template_items WHERE template_id = ${templateId} ORDER BY relative_day ASC, slot ASC, template_item_id ASC`); }
  async createPlanItemsFromTemplate(planId: number, items: Array<{ recipe_id: number; date: string; slot: MealPlanSlot; servings: number }>): Promise<number> { return this.prisma.$transaction(async (tx) => { await tx.$queryRaw(Prisma.sql`SELECT plan_id FROM meal_plans WHERE plan_id = ${planId} FOR UPDATE`); let applied = 0; for (const item of items) applied += await tx.$executeRaw(Prisma.sql`INSERT INTO meal_plan_items (plan_id, recipe_id, planned_date, slot, servings) VALUES (${planId}, ${item.recipe_id}, ${item.date}::date, ${item.slot}, ${item.servings}) ON CONFLICT (plan_id, planned_date, slot) DO NOTHING`); return applied; }); }
  async createRecurringRule(userId: number, dto: CreateRecurringMealRuleDto): Promise<RecurringRule> { const rows = await this.prisma.$queryRaw<RecurringRule[]>(Prisma.sql`INSERT INTO recurring_meal_rules (user_id, weekday, slot, recipe_id, servings) VALUES (${userId}, ${dto.weekday}, ${dto.slot}, ${dto.recipeId}, ${dto.servings}) RETURNING rule_id AS id, weekday, slot, recipe_id, servings`); return rows[0]; }
  listRecurringRules(userId: number): Promise<RecurringRule[]> { return this.prisma.$queryRaw<RecurringRule[]>(Prisma.sql`SELECT rule_id AS id, weekday, slot, recipe_id, servings FROM recurring_meal_rules WHERE user_id = ${userId} ORDER BY weekday ASC, slot ASC, rule_id ASC`); }
  async deleteRecurringRule(userId: number, ruleId: number): Promise<boolean> { return (await this.prisma.$executeRaw(Prisma.sql`DELETE FROM recurring_meal_rules WHERE user_id = ${userId} AND rule_id = ${ruleId}`)) > 0; }
  async recipeExists(recipeId: number): Promise<boolean> { const rows = await this.prisma.$queryRaw<Array<{ recipe_id: number }>>(Prisma.sql`SELECT recipe_id FROM recipes WHERE recipe_id = ${recipeId} AND status = 'published'`); return rows.length > 0; }
  listPlanItemsForTemplate(userId: number, planId: number): Promise<PlanSourceItem[]> { return this.prisma.$queryRaw<PlanSourceItem[]>(Prisma.sql`SELECT i.recipe_id, i.planned_date, i.slot, i.servings FROM meal_plan_items i JOIN meal_plans p ON p.plan_id = i.plan_id WHERE p.user_id = ${userId} AND i.plan_id = ${planId} AND i.source_type = 'recipe' ORDER BY i.planned_date ASC, i.slot ASC, i.item_id ASC`); }
}
