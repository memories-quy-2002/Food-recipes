import { RecoveryDeliveryService } from './recovery-delivery.service';

describe('RecoveryDeliveryService', () => {
  const originalEnvironment = { ...process.env };
  const fetchMock = jest.fn();
  let service: RecoveryDeliveryService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnvironment };
    process.env.NODE_ENV = 'development';
    process.env.AUTH_MAIL_WEBHOOK_URL = 'https://mail.example.test/recovery';
    process.env.AUTH_PUBLIC_WEB_URL = 'https://recipes.example.test';
    global.fetch = fetchMock;
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    service = new RecoveryDeliveryService();
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it('adds a password reset link without logging or returning the token', async () => {
    await expect(service.sendPasswordReset('cook@example.test', 'secret-token')).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://mail.example.test/recovery',
      expect.objectContaining({
        body: JSON.stringify({
          kind: 'password-reset',
          email: 'cook@example.test',
          token: 'secret-token',
          link: 'https://recipes.example.test/account/reset-password?token=secret-token',
        }),
      }),
    );
  });

  it('encodes tokens and builds verification links', async () => {
    await service.sendEmailVerification('cook@example.test', 'token with?&=');

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body))).toEqual({
      kind: 'email-verification',
      email: 'cook@example.test',
      token: 'token with?&=',
      link: 'https://recipes.example.test/account/verify-email?token=token+with%3F%26%3D',
    });
  });

  it('sends a null link when the public web URL is not configured', async () => {
    delete process.env.AUTH_PUBLIC_WEB_URL;

    await service.sendPasswordReset('cook@example.test', 'secret-token');

    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toEqual(
      expect.objectContaining({ link: null }),
    );
  });

  it('does not call the webhook in test mode', async () => {
    process.env.NODE_ENV = 'test';

    await service.sendEmailVerification('cook@example.test', 'token');

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
