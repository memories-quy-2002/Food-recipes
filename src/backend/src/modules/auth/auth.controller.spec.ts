import { AuthController } from './auth.controller';

describe('AuthController refresh cookie contract', () => {
  const throttle = {
    recordSuccess: jest.fn(),
    recordFailure: jest.fn(),
  };
  const request = {
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: {},
  } as any;

  const response = () => ({ cookie: jest.fn(), clearCookie: jest.fn() });

  beforeEach(() => jest.clearAllMocks());

  it('sets a persistent cookie for a remembered login and strips refresh fields from JSON', async () => {
    const authService = {
      login: jest.fn().mockResolvedValue({
        user: { user_id: 10, email: 'ada@example.com' },
        token: 'access-token',
        message: 'Logged in!',
        refreshToken: 'refresh-token',
        persistent: true,
      }),
    };
    const controller = new AuthController(authService as any, throttle as any);
    const res = response();

    const result = await controller.login(
      { email: 'ada@example.com', password: 'correct horse battery staple', remember: true } as any,
      request,
      res as any,
    );

    expect(res.cookie).toHaveBeenCalledWith('food_refresh', 'refresh-token', expect.objectContaining({
      httpOnly: true,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    }));
    expect(result).toEqual({
      user: { user_id: 10, email: 'ada@example.com' },
      token: 'access-token',
      message: 'Logged in!',
    });
  });

  it('sets a session cookie without maxAge for an unremembered login', async () => {
    const authService = {
      login: jest.fn().mockResolvedValue({
        user: { user_id: 10, email: 'ada@example.com' },
        token: 'access-token',
        message: 'Logged in!',
        refreshToken: 'refresh-token',
        persistent: false,
      }),
    };
    const controller = new AuthController(authService as any, throttle as any);
    const res = response();

    await controller.login(
      { email: 'ada@example.com', password: 'correct horse battery staple', remember: false } as any,
      request,
      res as any,
    );

    const cookieOptions = res.cookie.mock.calls[0][2];
    expect(cookieOptions).not.toHaveProperty('maxAge');
  });

  it('preserves a session-only cookie when refreshing a rotated session', async () => {
    const authService = {
      refresh: jest.fn().mockResolvedValue({
        user: { user_id: 10, email: 'ada@example.com' },
        token: 'access-token',
        message: 'Token refreshed!',
        refreshToken: 'rotated-refresh-token',
        persistent: false,
      }),
    };
    const controller = new AuthController(authService as any, throttle as any);
    const res = response();

    const result = await controller.refresh(
      { refreshToken: 'refresh-token' } as any,
      request,
      res as any,
    );

    expect(res.cookie.mock.calls[0][2]).not.toHaveProperty('maxAge');
    expect(result).toEqual({
      user: { user_id: 10, email: 'ada@example.com' },
      token: 'access-token',
      message: 'Token refreshed!',
    });
  });
});
