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
  const sessions = {
    createSession: jest.fn(),
    rotateSession: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessions.createSession.mockResolvedValue('refresh-token');
    sessions.rotateSession.mockResolvedValue({
      userId: 10,
      refreshToken: 'rotated-refresh-token',
      persistent: true,
    });
  });

  it('returns a token for valid credentials', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue({
      id: 10,
      email: 'ada@example.com',
      password: '$2b$10$3w5G4m9f2o9s0rWw6fQf7eX6P6gO8jQJwQZ2cX7YtU2m8T4x7oK1a',
      fullName: 'Ada Lovelace',
    });
    jwtService.signAsync.mockResolvedValue('signed-token');
    const service = new AuthService(usersService, jwtService, undefined, sessions as any);

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
    expect(sessions.createSession).toHaveBeenCalledWith(10, 30, false);
  });

  it('creates a persistent session when login explicitly remembers the user', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue({
      id: 10,
      email: 'ada@example.com',
      password: 'hashed-password',
      fullName: 'Ada Lovelace',
    });
    jwtService.signAsync.mockResolvedValue('signed-token');
    const service = new AuthService(usersService, jwtService, undefined, sessions as any);

    await service.login({
      email: 'ada@example.com',
      password: 'correct horse battery staple',
      remember: true,
    } as Parameters<AuthService['login']>[0]);

    expect(sessions.createSession).toHaveBeenCalledWith(10, 30, true);
  });

  it('creates a persistent session for signup', async () => {
    usersService.create.mockResolvedValue({
      user_id: 10,
      email: 'ada@example.com',
      email_verified: true,
    });
    jwtService.signAsync.mockResolvedValue('signed-token');
    const service = new AuthService(usersService, jwtService, undefined, sessions as any);

    await service.signup({
      name: { first: 'Ada', last: 'Lovelace' },
      email: 'ada@example.com',
      password: 'correct horse battery staple',
    } as any);

    expect(sessions.createSession).toHaveBeenCalledWith(10, 30, true);
  });

  it('keeps session persistence when rotating a refresh token', async () => {
    usersService.findById.mockResolvedValue({ user_id: 10, email: 'ada@example.com' });
    jwtService.signAsync.mockResolvedValue('signed-token');
    const service = new AuthService(usersService, jwtService, undefined, sessions as any);

    const result = await service.refresh('refresh-token');

    expect(sessions.rotateSession).toHaveBeenCalledWith('refresh-token', 30);
    expect(result).toEqual(expect.objectContaining({
      refreshToken: 'rotated-refresh-token',
      persistent: true,
    }));
  });

  it('rejects invalid credentials without revealing which field failed', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(null);
    const service = new AuthService(usersService, jwtService);

    await expect(
      service.login({ email: 'unknown@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
