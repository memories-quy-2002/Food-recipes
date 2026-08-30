import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schema = await readFile(path.join(root, 'prisma/schema.prisma'), 'utf8');
const migration = await readFile(path.join(root, 'prisma/migrations/20260830140000_add_saved_week_recurring_meals/migration.sql'), 'utf8');

assert.match(schema, /model MealPlanTemplate\s*\{/);
assert.match(schema, /model MealPlanTemplateItem\s*\{/);
assert.match(schema, /model RecurringMealRule\s*\{/);
assert.match(migration, /CREATE TABLE "meal_plan_templates"/);
assert.match(migration, /CREATE TABLE "meal_plan_template_items"/);
assert.match(migration, /CREATE TABLE "recurring_meal_rules"/);
assert.match(migration, /meal_plan_templates_user_fk.*REFERENCES "accounts"\("user_id"\)/s);
assert.match(migration, /meal_plan_template_items_template_fk.*REFERENCES "meal_plan_templates"\("template_id"\)/s);
assert.match(migration, /meal_plan_template_items_recipe_fk.*REFERENCES "recipes"\("recipe_id"\)/s);
assert.match(migration, /recurring_meal_rules_weekday_check.*BETWEEN 0 AND 6/s);
assert.match(migration, /recurring_meal_rules_slot_check.*breakfast.*lunch.*dinner.*snack/s);
assert.match(migration, /recurring_meal_rules_servings_check.*BETWEEN 1 AND 24/s);

console.log('saved-week recurring-meals migration validation passed');
