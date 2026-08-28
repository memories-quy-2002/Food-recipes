import { NotFoundException } from '@nestjs/common';
import { getPantryExpiryStatus, PantryService } from './pantry.service';
import type { PantryRepositoryPort } from './pantry.repository';

describe('PantryService', () => {
  const item = {
    pantry_id: 4,
    user_id: 7,
    name: 'Eggs',
    have: true,
    quantity: 12,
    unit: 'PIECE',
    purchased_at: null,
    opened_at: null,
    expires_at: null,
    storage_location: null,
    updated_at: new Date(),
  };
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

    await expect(service.create(7, { name: '  Eggs  ', quantity: 12, unit: 'piece', have: true })).resolves.toEqual({ item: { ...item, expiry_status: 'none' } });
    expect(repository.create).toHaveBeenCalledWith(7, 'Eggs', 12, 'PIECE', true, undefined, undefined, undefined, undefined);
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
    await expect(service.create(7, { name: 'Rice', quantity: 2.5, unit: 'kilogram' })).resolves.toEqual({ item: { ...item, expiry_status: 'none' } });
    expect(repository.create).toHaveBeenCalledWith(7, 'Rice', 2.5, 'KILOGRAM', true, undefined, undefined, undefined, undefined);
  });

  it('enforces ownership through repository-scoped updates', async () => {
    repository.update.mockResolvedValue(null);
    const service = new PantryService(repository);

    await expect(service.update(7, 99, { have: false })).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update).toHaveBeenCalledWith(7, 99, undefined, undefined, undefined, false, undefined, undefined, undefined, undefined);
  });

  it('persists normalized dates and storage location', async () => {
    repository.create.mockResolvedValue({
      ...item,
      expires_at: '2026-08-31',
      storage_location: 'fridge',
    });
    const service = new PantryService(repository);

    await expect(service.create(7, {
      name: 'Chicken',
      purchasedAt: '2026-08-27T08:00:00.000Z',
      openedAt: null,
      expiresAt: '2026-08-31',
      storageLocation: ' FRIDGE ',
    })).resolves.toEqual({ item: expect.objectContaining({ expires_at: '2026-08-31', storage_location: 'fridge', expiry_status: expect.any(String) }) });
    expect(repository.create).toHaveBeenCalledWith(7, 'Chicken', null, null, true, '2026-08-27', null, '2026-08-31', 'fridge');
  });

  describe('getPantryExpiryStatus', () => {
    const today = new Date('2026-08-28T12:00:00.000Z');

    it('marks yesterday as expired', () => {
      expect(getPantryExpiryStatus('2026-08-27', today)).toBe('expired');
    });

    it('marks today and three days from today as use soon', () => {
      expect(getPantryExpiryStatus('2026-08-28', today)).toBe('use_soon');
      expect(getPantryExpiryStatus('2026-08-31', today)).toBe('use_soon');
    });

    it('marks four days from today as fresh', () => {
      expect(getPantryExpiryStatus('2026-09-01', today)).toBe('fresh');
    });

    it('marks an item without an expiry as none', () => {
      expect(getPantryExpiryStatus(null, today)).toBe('none');
    });
  });
});
