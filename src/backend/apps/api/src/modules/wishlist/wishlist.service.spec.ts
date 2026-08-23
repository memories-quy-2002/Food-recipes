import { NotFoundException } from '@nestjs/common';
import { WishlistService } from './wishlist.service';

describe('WishlistService', () => {
  const repository = {
    listByUserId: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
  };

  const item = {
    recipe: { recipe_id: 15, recipe_name: 'Pasta Carbonara' },
    savedAt: '2026-08-23T06:30:00.000Z',
  };

  beforeEach(() => jest.clearAllMocks());

  it('lists saved recipes for the authenticated user with recipe summaries and savedAt', async () => {
    repository.listByUserId.mockResolvedValue([item]);
    const service = new WishlistService(repository);

    await expect(service.list(7)).resolves.toEqual({ wishlist: [item] });
    expect(repository.listByUserId).toHaveBeenCalledWith(7);
  });

  it('returns the existing saved item when add is repeated for the same user and recipe', async () => {
    repository.add.mockResolvedValue(item);
    const service = new WishlistService(repository);

    await expect(service.add(7, 15)).resolves.toEqual(item);
    await expect(service.add(7, 15)).resolves.toEqual(item);
    expect(repository.add).toHaveBeenNthCalledWith(1, 7, 15);
    expect(repository.add).toHaveBeenNthCalledWith(2, 7, 15);
  });

  it('does not accept a missing recipe as a saved item', async () => {
    repository.add.mockResolvedValue(null);
    const service = new WishlistService(repository);

    await expect(service.add(7, 404)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes a recipe only from the authenticated user wishlist', async () => {
    repository.remove.mockResolvedValue(true);
    const service = new WishlistService(repository);

    await expect(service.remove(7, 15)).resolves.toEqual({
      message: 'Wishlist item removed',
    });
    expect(repository.remove).toHaveBeenCalledWith(7, 15);
  });
});
