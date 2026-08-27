import { calculateInventoryConsumption, convertQuantity } from './pantry-inventory';

describe('pantry inventory calculations', () => {
  it('scales recipe amounts by servings and consumes only available stock', () => {
    const result = calculateInventoryConsumption(
      [{ position: 1, name: 'rice', quantity: 500, unit: 'GRAM' }],
      [{ pantry_id: 1, name: 'rice', have: true, quantity: 300, unit: 'GRAM' }],
      2,
      1,
    );

    expect(result.consumptions[0]).toMatchObject({
      required_quantity: 1000,
      available_quantity: 300,
      deducted_quantity: 300,
      missing_quantity: 700,
      pantry_id: 1,
    });
    expect(result.shortages).toHaveLength(1);
  });

  it('converts compatible units but does not mix dimensions', () => {
    expect(convertQuantity(1, 'KILOGRAM', 'GRAM')).toBe(1000);
    expect(convertQuantity(1, 'CUP', 'MILLILITER')).toBe(240);
    expect(convertQuantity(1, 'PIECE', 'GRAM')).toBeNull();
  });

  it('accepts common unit abbreviations when matching recipe data', () => {
    const result = calculateInventoryConsumption(
      [{ position: 1, name: 'rice', quantity: 1, unit: 'kg' }],
      [{ pantry_id: 1, name: 'rice', have: true, quantity: 500, unit: 'GRAM' }],
      1,
      1,
    );

    expect(result.shortages[0]).toMatchObject({
      required_quantity: 1,
      required_unit: 'KILOGRAM',
      missing_quantity: 0.5,
    });
  });

  it('reports ingredients without a numeric amount or supported unit', () => {
    const result = calculateInventoryConsumption(
      [
        { position: 1, name: 'salt', quantityText: 'a little', unit: 'TEASPOON' },
        { position: 2, name: 'pepper', quantity: 1, unit: null },
      ],
      [],
      1,
      1,
    );

    expect(result.invalid_ingredients).toEqual(['salt', 'pepper']);
    expect(result.consumptions).toHaveLength(0);
  });
});
