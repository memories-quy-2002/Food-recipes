import { RecoveryDeliveryService } from './recovery-delivery.service';

describe('RecoveryDeliveryService', () => {
  const originalEnvironment = { ...process.env };
  const fetchMock = jest.fn();
  let service: RecoveryDeliveryService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnvironment };
    process.env.NODE_ENV = 'development';
    process.env.BREVO_API_KEY = 'brevo-test-key';
    process.env.AUTH_MAIL_FROM_EMAIL = 'no-reply@recipes.example.test';
    process.env.AUTH_MAIL_FROM_NAME = 'Food Recipes';
    process.env.AUTH_PUBLIC_WEB_URL = 'https://recipes.example.test';
    global.fetch = fetchMock;
    fetchMock.mockResolvedValue({ ok: true, status: 201 });
    service = new RecoveryDeliveryService();
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it('sends password reset mail through Brevo with a link but no standalone token', async () => {
    await expect(service.sendPasswordReset('cook@example.test', 'secret-token')).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': 'brevo-test-key',
        'content-type': 'application/json',
      },
      redirect: 'error',
      signal: expect.any(AbortSignal),
      body: expect.any(String),
    });
    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(body).toMatchObject({
      sender: { email: 'no-reply@recipes.example.test', name: 'Food Recipes' },
      to: [{ email: 'cook@example.test' }],
      subject: 'Reset your Food Recipes password',
    });
    expect(body.textContent).toContain(
      'https://recipes.example.test/account/reset-password?token=secret-token',
    );
    expect(body.htmlContent).toContain(
      'https://recipes.example.test/account/reset-password?token=secret-token',
    );
    expect(body).not.toHaveProperty('token');
  });

  it('encodes verification tokens in the link', async () => {
    await service.sendEmailVerification('cook@example.test', 'token with?&="');

    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    const link =
      'https://recipes.example.test/account/verify-email?token=token+with%3F%26%3D%22';
    expect(body.subject).toBe('Verify your Food Recipes email');
    expect(body.textContent).toContain(link);
    expect(body.htmlContent).toContain(link);
  });

  it('does not send when the public web URL is not configured outside production', async () => {
    delete process.env.AUTH_PUBLIC_WEB_URL;

    await service.sendPasswordReset('cook@example.test', 'secret-token');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not call Brevo in test mode', async () => {
    process.env.NODE_ENV = 'test';

    await service.sendEmailVerification('cook@example.test', 'token');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails explicitly in production when Brevo configuration is missing', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.BREVO_API_KEY;

    await expect(
      service.sendPasswordReset('cook@example.test', 'token'),
    ).rejects.toThrow('Recovery delivery is not configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails explicitly in production when recovery links cannot be built', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.AUTH_PUBLIC_WEB_URL;

    await expect(
      service.sendEmailVerification('cook@example.test', 'token'),
    ).rejects.toThrow('Recovery public web URL is not configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not expose the provider response body when Brevo rejects delivery', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
    });

    await expect(service.sendPasswordReset('cook@example.test', 'token')).rejects.toThrow(
      'Recovery delivery failed with status 401',
    );
  });
});
