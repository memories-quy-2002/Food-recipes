import { calculateWeeklyShopping, type WeeklyShoppingMeal } from './weekly-shopping.calculator';

const meal = (
  recipeId: number,
  requirements: Array<[string, number | null, string | null, number | null]>,
): WeeklyShoppingMeal => ({
  recipeId,
  ingredients: requirements.map(([name, required, unit, available], position) => ({
    position,
    ingredient_name: name,
    required_quantity: required,
    required_unit: unit,
    available_quantity: available,
    missing_quantity: required === null ? null : Math.max(0, required - (available ?? 0)),
    pantry_id: available === null ? null : 17,
    status: required === null ? 'needs_details' : 'missing',
  })),
});

describe('calculateWeeklyShopping', () => {
  it('adds every meal, converts compatible units, and deducts pantry once', () => {
    const result = calculateWeeklyShopping([
      meal(11, [['Rice', 0.5, 'KILOGRAM', 0.2]]),
      meal(11, [[' rice ', 300, 'GRAM', 200]]),
    ], []);
    expect(result.items).toEqual([expect.objectContaining({
      name: 'Rice', quantity: '600 g', requiredQuantity: 800,
      availableQuantity: 200, missingQuantity: 600, sourceRecipeId: 11,
    })]);
  });

  it('does not combine incompatible units or invent legacy quantities', () => {
    const result = calculateWeeklyShopping([
      meal(11, [['Milk', 2, 'LITER', null], ['Salt', null, null, null]]),
      meal(12, [['Milk', 3, 'PIECE', null]]),
    ], []);
    expect(result.items.map((item) => item.quantity)).toEqual(['2000 ml', '3 pcs']);
    expect(result.needsDetails).toEqual(['Salt']);
  });

  it('marks an exact existing unchecked line as already present without overwriting it', () => {
    const result = calculateWeeklyShopping([meal(11, [['Egg', 4, 'PIECE', null]])], [
      { label: ' egg ', quantity: '4 pcs', checked: false },
    ]);
    expect(result.items[0]).toEqual(expect.objectContaining({ alreadyListed: true }));
  });

  it('never rounds a small positive shortage down to zero', () => {
    const result = calculateWeeklyShopping([meal(11, [['Spice', 0.0002, 'KILOGRAM', 0]])], []);
    expect(result.items[0].missingQuantity).toBeGreaterThan(0);
  });

  it('omits fully covered ingredients', () => {
    const result = calculateWeeklyShopping([meal(11, [['Rice', 100, 'GRAM', 500]])], []);
    expect(result.items).toEqual([]);
  });
});
