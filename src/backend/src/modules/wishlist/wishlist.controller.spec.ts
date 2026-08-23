import { WishlistController } from './wishlist.controller';

describe('WishlistController', () => {
  const service = {
    list: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('forwards the JWT user id rather than a request-owned user id', async () => {
    service.list.mockResolvedValue({ wishlist: [] });
    service.add.mockResolvedValue({ recipe: { recipe_id: 15 }, savedAt: 'now' });
    service.remove.mockResolvedValue({ message: 'Wishlist item removed' });
    const controller = new WishlistController(service);
    const user = { id: 7, email: 'ada@example.com' };

    await controller.list(user);
    await controller.add(user, { recipeId: 15 });
    await controller.remove(15, user);

    expect(service.list).toHaveBeenCalledWith(7);
    expect(service.add).toHaveBeenCalledWith(7, 15);
    expect(service.remove).toHaveBeenCalledWith(7, 15);
  });
});
