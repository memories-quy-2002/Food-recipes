import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  const usersService = {
    findByEmailWithPassword: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    toPublicUser: jest.fn((user) => ({
      user_id: user.id,
      full_name: user.fullName,
      email: user.email,
      created_on: new Date(),
      last_login: null,
      phone: null,
      address: null,
    })),
  };
  const jwtService = { signAsync: jest.fn(), verifyAsync: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('returns a token for valid credentials', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue({
      id: 10,
      email: 'ada@example.com',
      password: '$2b$10$3w5G4m9f2o9s0rWw6fQf7eX6P6gO8jQJwQZ2cX7YtU2m8T4x7oK1a',
      fullName: 'Ada Lovelace',
    });
    jwtService.signAsync.mockResolvedValue('signed-token');
    const service = new AuthService(usersService, jwtService);

    const result = await service.login({
      email: 'ada@example.com',
      password: 'correct horse battery staple',
    });

    expect(result).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({ user_id: 10, email: 'ada@example.com' }),
        token: 'signed-token',
        message: 'Logged in!',
      }),
    );
  });

  it('rejects invalid credentials without revealing which field failed', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(null);
    const service = new AuthService(usersService, jwtService);

    await expect(
      service.login({ email: 'unknown@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
