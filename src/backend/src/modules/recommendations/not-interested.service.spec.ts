import { NotInterestedService } from './not-interested.service';

describe('NotInterestedService', () => {
  it('delegates PUT and DELETE with the current user id', async () => {
    const repository = { add: jest.fn().mockResolvedValue(true), remove: jest.fn().mockResolvedValue(false) };
    const service = new NotInterestedService(repository);

    await expect(service.add(7, 15)).resolves.toEqual({ message: 'Recipe marked not interested' });
    await expect(service.remove(7, 15)).resolves.toEqual({ message: 'Recipe removed from not interested' });
    expect(repository.add).toHaveBeenCalledWith(7, 15);
    expect(repository.remove).toHaveBeenCalledWith(7, 15);
  });

  it('rejects PUT for a missing or unpublished recipe', async () => {
    const repository = { add: jest.fn().mockResolvedValue(false), remove: jest.fn() };
    const service = new NotInterestedService(repository);

    await expect(service.add(7, 404)).rejects.toMatchObject({ response: { code: 'RECIPE_NOT_FOUND' } });
  });
});
