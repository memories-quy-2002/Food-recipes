export const PANTRY_UNITS = [
  'GRAM',
  'KILOGRAM',
  'MILLILITER',
  'LITER',
  'TEASPOON',
  'TABLESPOON',
  'CUP',
  'PIECE',
] as const;

export type PantryUnit = (typeof PANTRY_UNITS)[number];
export type PantryUnitGroup = 'mass' | 'volume' | 'count';

const unitGroups: Record<PantryUnit, PantryUnitGroup> = {
  GRAM: 'mass',
  KILOGRAM: 'mass',
  MILLILITER: 'volume',
  LITER: 'volume',
  TEASPOON: 'volume',
  TABLESPOON: 'volume',
  CUP: 'volume',
  PIECE: 'count',
};

// Use grams, milliliters, and pieces as the respective base units.
// Household volume measures are intentionally approximate.
const unitFactors: Record<PantryUnit, number> = {
  GRAM: 1,
  KILOGRAM: 1000,
  MILLILITER: 1,
  LITER: 1000,
  TEASPOON: 5,
  TABLESPOON: 15,
  CUP: 240,
  PIECE: 1,
};

export type InventoryRecipeIngredient = {
  ingredient_id?: number;
  position: number;
  name: string;
  quantity?: number | string | null;
  quantityText?: string | null;
  quantity_text?: string | null;
  unit?: string | null;
  unit_text?: string | null;
};

export type InventoryPantryItem = {
  pantry_id: number;
  name: string;
  have: boolean;
  quantity: number | null;
  unit: PantryUnit | null;
};

export type InventoryShortage = {
  position: number;
  ingredient_name: string;
  required_quantity: number;
  required_unit: PantryUnit;
  available_quantity: number;
  missing_quantity: number;
  pantry_id: number | null;
};

export type InventoryConsumption = InventoryShortage & {
  deducted_quantity: number;
};

export type InventoryCalculation = {
  consumptions: InventoryConsumption[];
  shortages: InventoryShortage[];
  invalid_ingredients: string[];
};

export const normalizePantryUnit = (value: string | null | undefined): PantryUnit | null => {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  const aliases: Record<string, PantryUnit> = {
    G: 'GRAM', GRAM: 'GRAM', GRAMS: 'GRAM',
    KG: 'KILOGRAM', KILOGRAM: 'KILOGRAM', KILOGRAMS: 'KILOGRAM',
    ML: 'MILLILITER', MILLILITER: 'MILLILITER', MILLILITERS: 'MILLILITER',
    L: 'LITER', LITER: 'LITER', LITERS: 'LITER', LITRE: 'LITER', LITRES: 'LITER',
    TSP: 'TEASPOON', TEASPOON: 'TEASPOON', TEASPOONS: 'TEASPOON',
    TBSP: 'TABLESPOON', TABLESPOON: 'TABLESPOON', TABLESPOONS: 'TABLESPOON',
    CUP: 'CUP', CUPS: 'CUP',
    PC: 'PIECE', PCS: 'PIECE', PIECE: 'PIECE', PIECES: 'PIECE',
  };
  return aliases[normalized] ?? (PANTRY_UNITS.includes(normalized as PantryUnit) ? normalized as PantryUnit : null);
};

export const normalizeIngredientName = (value: string): string =>
  value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

export const parseQuantityText = (value: string | null | undefined): number | null => {
  if (!value?.trim()) return null;
  const normalized = value.trim().replace(',', '.');
  const mixed = normalized.match(/^(\d+(?:\.\d+)?)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const denominator = Number(mixed[3]);
    return denominator > 0 ? Number(mixed[1]) + Number(mixed[2]) / denominator : null;
  }
  const fraction = normalized.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    return denominator > 0 ? Number(fraction[1]) / denominator : null;
  }
  const quantity = Number(normalized);
  return Number.isFinite(quantity) ? quantity : null;
};

export type ParsedShoppingListQuantity = {
  quantity: number;
  unit: PantryUnit;
};

export const parseShoppingListQuantity = (value: string | null | undefined): ParsedShoppingListQuantity | null => {
  const match = value?.trim().match(/^((?:\d+(?:[.,]\d+)?\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?))\s*([a-zA-Z]+)$/);
  if (!match) return null;

  const quantity = parseQuantityText(match[1]);
  const unit = normalizePantryUnit(match[2]);
  if (quantity === null || quantity <= 0 || !unit) return null;
  return { quantity, unit };
};

export const convertQuantity = (
  quantity: number,
  fromUnit: PantryUnit,
  toUnit: PantryUnit,
): number | null => {
  if (unitGroups[fromUnit] !== unitGroups[toUnit]) return null;
  return (quantity * unitFactors[fromUnit]) / unitFactors[toUnit];
};

export const formatInventoryQuantity = (quantity: number): string => {
  const rounded = Number(quantity.toFixed(3));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

const roundQuantity = (quantity: number): number => Number(quantity.toFixed(3));

const readIngredientQuantity = (ingredient: InventoryRecipeIngredient): number | null => {
  const rawQuantity: unknown = ingredient.quantity;
  const quantity = typeof rawQuantity === 'number'
    ? rawQuantity
    : typeof rawQuantity === 'string'
      ? parseQuantityText(rawQuantity)
      : rawQuantity !== null && rawQuantity !== undefined
        ? Number(rawQuantity)
        : parseQuantityText(ingredient.quantityText ?? ingredient.quantity_text);
  return quantity !== null && Number.isFinite(quantity) && quantity > 0 ? quantity : null;
};

export const calculateInventoryConsumption = (
  ingredients: InventoryRecipeIngredient[],
  pantryItems: InventoryPantryItem[],
  servings: number,
  baseServings: number,
): InventoryCalculation => {
  const availableByPantry = new Map<number, number>();
  const pantryByName = new Map<string, InventoryPantryItem>();
  pantryItems.forEach((item) => {
    if (item.have && item.quantity !== null && item.quantity > 0 && item.unit) {
      availableByPantry.set(item.pantry_id, item.quantity * unitFactors[item.unit]);
      pantryByName.set(normalizeIngredientName(item.name), item);
    }
  });

  const consumptions: InventoryConsumption[] = [];
  const invalidIngredients: string[] = [];
  for (const ingredient of ingredients) {
    const quantity = readIngredientQuantity(ingredient);
    const unit = normalizePantryUnit(ingredient.unit ?? ingredient.unit_text);
    if (quantity === null || !unit) {
      invalidIngredients.push(ingredient.name.trim());
      continue;
    }

    const requiredQuantity = roundQuantity(quantity * (servings / Math.max(baseServings, 1)));
    const requiredBaseQuantity = requiredQuantity * unitFactors[unit];
    const pantryItem = pantryByName.get(normalizeIngredientName(ingredient.name));
    const availableBaseQuantity = pantryItem ? availableByPantry.get(pantryItem.pantry_id) ?? 0 : 0;
    const deductedBaseQuantity = Math.min(requiredBaseQuantity, availableBaseQuantity);
    const missingBaseQuantity = Math.max(requiredBaseQuantity - deductedBaseQuantity, 0);
    const consumption: InventoryConsumption = {
      position: ingredient.position,
      ingredient_name: ingredient.name.trim(),
      required_quantity: requiredQuantity,
      required_unit: unit,
      available_quantity: roundQuantity(availableBaseQuantity / unitFactors[unit]),
      deducted_quantity: roundQuantity(deductedBaseQuantity / unitFactors[unit]),
      missing_quantity: roundQuantity(missingBaseQuantity / unitFactors[unit]),
      pantry_id: pantryItem?.pantry_id ?? null,
    };
    consumptions.push(consumption);
    if (pantryItem) availableByPantry.set(pantryItem.pantry_id, Math.max(availableBaseQuantity - deductedBaseQuantity, 0));
  }

  return {
    consumptions,
    shortages: consumptions.filter((consumption) => consumption.missing_quantity > 0),
    invalid_ingredients: [...new Set(invalidIngredients.filter(Boolean))],
  };
};
