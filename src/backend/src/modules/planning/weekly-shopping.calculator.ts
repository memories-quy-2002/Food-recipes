import {
  convertQuantity,
  formatInventoryQuantity,
  normalizeIngredientName,
  normalizePantryUnit,
  type PantryUnit,
} from '../pantry/pantry-inventory';
import type { PreparedIngredientRecord } from './planning.repository';

export type WeeklyShoppingMeal = {
  recipeId: number;
  ingredients: PreparedIngredientRecord[];
};

export type ExistingWeeklyShoppingLine = {
  label: string;
  quantity: string | null;
  checked: boolean;
};

export type WeeklyShoppingLine = {
  name: string;
  unit: PantryUnit;
  requiredQuantity: number;
  availableQuantity: number;
  missingQuantity: number;
  quantity: string;
  sourceRecipeId: number | null;
  alreadyListed: boolean;
};

export type WeeklyShoppingCalculation = {
  items: WeeklyShoppingLine[];
  needsDetails: string[];
};

const baseUnits: readonly PantryUnit[] = ['GRAM', 'MILLILITER', 'PIECE'];
const unitLabels: Record<PantryUnit, string> = {
  GRAM: 'g',
  KILOGRAM: 'kg',
  MILLILITER: 'ml',
  LITER: 'l',
  TEASPOON: 'tsp',
  TABLESPOON: 'tbsp',
  CUP: 'cup',
  PIECE: 'pcs',
};
const round = (value: number): number => Number(value.toFixed(3));

/**
 * Aggregate every planned meal, convert compatible units, and deduct each
 * ingredient's shared pantry balance once, rather than once per recipe.
 * Unknown quantities stay outside the automatically persisted shopping list.
 */
export function calculateWeeklyShopping(
  meals: readonly WeeklyShoppingMeal[],
  existingItems: readonly ExistingWeeklyShoppingLine[],
): WeeklyShoppingCalculation {
  const groups = new Map<string, {
    name: string;
    unit: PantryUnit;
    required: number;
    available: number;
    sourceRecipeIds: Set<number>;
  }>();
  const needsDetails = new Map<string, string>();

  for (const meal of meals) {
    for (const ingredient of meal.ingredients) {
      const name = ingredient.ingredient_name.trim();
      const normalized = normalizeIngredientName(name);
      if (!normalized) continue;
      const unit = normalizePantryUnit(ingredient.required_unit);
      const quantity = ingredient.required_quantity;

      if (!unit || quantity === null || !Number.isFinite(quantity) || quantity <= 0) {
        if (!needsDetails.has(normalized)) needsDetails.set(normalized, name);
        continue;
      }

      const baseUnit = baseUnits.find((candidate) => convertQuantity(1, unit, candidate) !== null);
      if (!baseUnit) {
        if (!needsDetails.has(normalized)) needsDetails.set(normalized, name);
        continue;
      }

      const required = convertQuantity(quantity, unit, baseUnit);
      const available = convertQuantity(Math.max(0, ingredient.available_quantity ?? 0), unit, baseUnit);
      if (required === null || available === null) continue;
      const key = normalized + ':' + baseUnit;
      const existing = groups.get(key);
      if (existing) {
        existing.required += required;
        // A recipe-level comparison sees the same pantry balance for each
        // meal. Summing these balances would subtract inventory repeatedly.
        existing.available = Math.max(existing.available, available);
        existing.sourceRecipeIds.add(meal.recipeId);
      } else {
        groups.set(key, {
          name,
          unit: baseUnit,
          required,
          available,
          sourceRecipeIds: new Set([meal.recipeId]),
        });
      }
    }
  }

  const items: WeeklyShoppingLine[] = [];
  for (const group of groups.values()) {
    const missingQuantity = round(Math.max(0, group.required - group.available));
    if (missingQuantity <= 0) continue;
    const quantity = formatInventoryQuantity(missingQuantity) + ' ' + unitLabels[group.unit];
    items.push({
      name: group.name,
      unit: group.unit,
      requiredQuantity: round(group.required),
      availableQuantity: round(group.available),
      missingQuantity,
      quantity,
      sourceRecipeId: group.sourceRecipeIds.size === 1 ? [...group.sourceRecipeIds][0] : null,
      alreadyListed: existingItems.some((item) =>
        !item.checked &&
        normalizeIngredientName(item.label) === normalizeIngredientName(group.name) &&
        item.quantity?.trim().toLowerCase() === quantity.toLowerCase()),
    });
  }

  return {
    items: items.sort((a, b) => normalizeIngredientName(a.name).localeCompare(normalizeIngredientName(b.name)) || a.unit.localeCompare(b.unit)),
    needsDetails: [...needsDetails.values()].sort((a, b) => a.localeCompare(b)),
  };
}
