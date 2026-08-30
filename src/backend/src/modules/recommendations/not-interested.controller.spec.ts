import { NotInterestedController } from './not-interested.controller';

describe('NotInterestedController', () => {
  it('forwards the JWT user id for both mutations', async () => {
    const service = { add: jest.fn(), remove: jest.fn() };
    const controller = new NotInterestedController(service);
    const user = { id: 7, email: 'ada@example.com' };

    await controller.add(15, user);
    await controller.remove(15, user);

    expect(service.add).toHaveBeenCalledWith(7, 15);
    expect(service.remove).toHaveBeenCalledWith(7, 15);
  });
});
