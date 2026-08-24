import { NotFoundException } from '@nestjs/common';
import { PantryService } from './pantry.service';
import type { PantryRepositoryPort } from './pantry.repository';

describe('PantryService', () => {
  const item = { pantry_id: 4, user_id: 7, name: 'Eggs', have: true, updated_at: new Date() };
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

    await expect(service.create(7, { name: '  Eggs  ', have: true })).resolves.toEqual({ item });
    expect(repository.create).toHaveBeenCalledWith(7, 'Eggs', true);
  });

  it('rejects blank names', async () => {
    const service = new PantryService(repository);

    await expect(service.create(7, { name: '   ', have: true })).rejects.toMatchObject({ response: { code: 'PANTRY_NAME_EMPTY' } });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('enforces ownership through repository-scoped updates', async () => {
    repository.update.mockResolvedValue(null);
    const service = new PantryService(repository);

    await expect(service.update(7, 99, { have: false })).rejects.toBeInstanceOf(NotFoundException);
  });
});
