import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

describe('HTTP security boundary', () => {
  let app: INestApplication;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://security:security@127.0.0.1:5432/security_boundary';
    process.env.JWT_SECRET = '8mR!2qV#7xL@4pN$9zK%6tH&3cW^1jF*5sD';
    const { createApplication } = await import('../src/main');
    app = await createApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  });

  it('sets the baseline browser security headers on a live response', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health/live');

    expect(response.status).toBe(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('rejects missing and malformed credentials before protected handlers run', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);

    await request(app.getHttpServer())
      .get('/api/v1/users/me/wishlist')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);

    await request(app.getHttpServer()).get('/api/v1/admin/review-reports').expect(401);
  });

  it('rejects unknown input fields at the validation boundary', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'security@example.com',
        password: 'not-a-real-password',
        userId: 42,
      })
      .expect(400);
  });

  it('rejects payloads above the configured body limit', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: `${'x'.repeat(300_000)}@example.com`,
        password: 'not-a-real-password',
      })
      .expect(413);
  });
});
