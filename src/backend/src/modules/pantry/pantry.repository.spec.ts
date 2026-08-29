import { PantryRepository } from './pantry.repository';

const sqlSource = (query: { strings: readonly string[] }) => query.strings.join(' ');

describe('PantryRepository shopping-list import', () => {
  const prisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $transaction: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('moves a checked structured shopping item into pantry and removes it from the list', async () => {
    const transaction = {
      $queryRaw: jest.fn()
        .mockResolvedValueOnce([{ item_id: 10, label: 'Rice', quantity: '500 g' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ pantry_id: 21 }]),
      $executeRaw: jest.fn().mockResolvedValue(1),
    };
    prisma.$transaction.mockImplementation(async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction));
    const repository = new PantryRepository(prisma as never);

    await expect(repository.importCheckedShoppingItems(7)).resolves.toEqual({
      imported_items: 1,
      skipped_items: [],
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(sqlSource(transaction.$queryRaw.mock.calls[2][0])).toContain('INSERT INTO pantry_items');
    expect(sqlSource(transaction.$executeRaw.mock.calls[0][0])).toContain('DELETE FROM shopping_list_items');
  });

  it('keeps checked free-form shopping items until quantity and unit are provided', async () => {
    const transaction = {
      $queryRaw: jest.fn()
        .mockResolvedValueOnce([{ item_id: 11, label: 'Fresh herbs', quantity: 'a handful' }])
        .mockResolvedValueOnce([]),
      $executeRaw: jest.fn(),
    };
    prisma.$transaction.mockImplementation(async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction));
    const repository = new PantryRepository(prisma as never);

    await expect(repository.importCheckedShoppingItems(7)).resolves.toEqual({
      imported_items: 0,
      skipped_items: [{ item_id: 11, label: 'Fresh herbs', quantity: 'a handful', reason: 'quantity_or_unit_required' }],
    });
    expect(transaction.$executeRaw).not.toHaveBeenCalled();
  });
});
