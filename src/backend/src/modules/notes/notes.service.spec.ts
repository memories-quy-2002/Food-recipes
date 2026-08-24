import { NotFoundException } from '@nestjs/common';
import { NotesService } from './notes.service';
import type { NotesRepositoryPort } from './notes.repository';

describe('NotesService', () => {
  const repository: jest.Mocked<NotesRepositoryPort> = {
    recipeExists: jest.fn(),
    findByUserAndRecipe: jest.fn(),
    upsert: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('writes a trimmed private note only for an existing recipe', async () => {
    repository.recipeExists.mockResolvedValue(true);
    repository.upsert.mockResolvedValue({ user_id: 7, recipe_id: 15, note: 'Use less salt', updated_at: new Date() });
    const service = new NotesService(repository);

    await expect(service.upsert(7, 15, { note: '  Use less salt  ' })).resolves.toMatchObject({ note: { note: 'Use less salt' } });
    expect(repository.upsert).toHaveBeenCalledWith(7, 15, 'Use less salt');
  });

  it('does not expose note writes for a missing recipe', async () => {
    repository.recipeExists.mockResolvedValue(false);
    const service = new NotesService(repository);

    await expect(service.upsert(7, 404, { note: 'Private' })).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it('returns a stable empty note when the user has not written one', async () => {
    repository.recipeExists.mockResolvedValue(true);
    repository.findByUserAndRecipe.mockResolvedValue(null);
    const service = new NotesService(repository);

    await expect(service.get(7, 15)).resolves.toEqual({ note: null });
  });
});
