import { NotFoundException } from '@nestjs/common';
import { PantryService } from './pantry.service';
import type { PantryRepositoryPort } from './pantry.repository';

describe('PantryService', () => {
  const item = { pantry_id: 4, user_id: 7, name: 'Eggs', have: true, quantity: 12, unit: 'PIECE', updated_at: new Date() };
  const repository: jest.Mocked<PantryRepositoryPort> = {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('trims item names before creating an owned pantry item', async () => {
    repository.create.mockResolvedValue(item);
    const service = new PantryService(repository);

    await expect(service.create(7, { name: '  Eggs  ', quantity: 12, unit: 'piece', have: true })).resolves.toEqual({ item });
    expect(repository.create).toHaveBeenCalledWith(7, 'Eggs', 12, 'PIECE', true);
  });

  it('rejects blank names', async () => {
    const service = new PantryService(repository);

    await expect(service.create(7, { name: '   ', have: true })).rejects.toMatchObject({ response: { code: 'PANTRY_NAME_EMPTY' } });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects a quantity without a matching unit', async () => {
    const service = new PantryService(repository);

    await expect(service.create(7, { name: 'Eggs', quantity: 12 })).rejects.toMatchObject({ response: { code: 'PANTRY_QUANTITY_UNIT_REQUIRED' } });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('normalizes and validates inventory quantities', async () => {
    repository.create.mockResolvedValue(item);
    const service = new PantryService(repository);

    await expect(service.create(7, { name: 'Rice', quantity: 1.23456, unit: 'KILOGRAM' })).rejects.toBeInstanceOf(Error);
    await expect(service.create(7, { name: 'Rice', quantity: -1, unit: 'KILOGRAM' })).rejects.toMatchObject({ response: { code: 'PANTRY_QUANTITY_INVALID' } });
    await expect(service.create(7, { name: 'Rice', quantity: 2.5, unit: 'kilogram' })).resolves.toEqual({ item });
    expect(repository.create).toHaveBeenCalledWith(7, 'Rice', 2.5, 'KILOGRAM', true);
  });

  it('enforces ownership through repository-scoped updates', async () => {
    repository.update.mockResolvedValue(null);
    const service = new PantryService(repository);

    await expect(service.update(7, 99, { have: false })).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update).toHaveBeenCalledWith(7, 99, undefined, undefined, undefined, false);
  });
});
