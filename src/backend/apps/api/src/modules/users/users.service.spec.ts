import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const repository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    updateProfile: jest.fn(),
    updatePassword: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('creates a user with a hashed password and public response', async () => {
    repository.findByEmail.mockResolvedValue(null);
    repository.create.mockResolvedValue({
      id: 10,
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: '$2b$10$hashed',
      createdOn: new Date('2026-08-23T00:00:00.000Z'),
      lastLogin: null,
      phone: null,
      address: null,
    });
    const service = new UsersService(repository);

    const user = await service.create({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'correct horse battery staple',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        password: expect.not.stringMatching(/correct horse/),
      }),
    );
    expect(user).not.toHaveProperty('password');
    expect(user).toMatchObject({ user_id: 10, email: 'ada@example.com' });
  });

  it('rejects duplicate email', async () => {
    repository.findByEmail.mockResolvedValue({ id: 10 });
    const service = new UsersService(repository);

    await expect(
      service.create({
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'correct horse battery staple',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a missing user lookup', async () => {
    repository.findById.mockResolvedValue(null);
    const service = new UsersService(repository);

    await expect(service.findById(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
