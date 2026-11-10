import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  it('accepts a local development environment with a realistic random-looking JWT secret', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        PORT: '3000',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/food_recipes',
        JWT_SECRET: '7fK2!mQ9#vL4@xR8$zN3%pT6&cW1^hJ5*',
        CORS_ORIGINS: 'http://localhost:5173',
      }),
    ).not.toThrow();
  });

  it('rejects a missing database URL', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        PORT: '3000',
        JWT_SECRET: '7fK2!mQ9#vL4@xR8$zN3%pT6&cW1^hJ5*',
      }),
    ).toThrow(/DATABASE_URL/);
  });

  it('rejects a short JWT secret', () => {
    expect(() =>
      validateEnvironment({
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/food_recipes',
        JWT_SECRET: 'short',
      }),
    ).toThrow(/JWT_SECRET/);
  });

  it('rejects the development marker even when it is long enough', () => {
    expect(() =>
      validateEnvironment({
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/food_recipes',
        JWT_SECRET: 'development-secret-with-enough-length',
      }),
    ).toThrow(/JWT_SECRET/);
  });

  it.each([
    'test-secret-with-enough-length',
    'local-secret-with-enough-length',
    'default-secret-with-enough-length',
    'example-secret-with-enough-length',
    'secret-with-enough-length',
    'password-with-enough-length',
    'placeholder-with-enough-length',
    'sample-secret-with-enough-length',
    'dummy-secret-with-enough-length',
    'fake-secret-with-enough-length',
    'dev-secret-with-enough-length',
    'replace-with-a-random-secret-of-at-least-32-characters',
    'change-me-to-a-random-secret-of-at-least-32-characters',
    'generate-a-random-secret-of-at-least-32-characters',
    'developmentsecret12345678901234567890',
    'dev123456789012345678901234567890',
    'password1234567890123456789012345678',
    'replacewith123456789012345678901234567',
  ])('rejects the placeholder JWT secret %s', (jwtSecret) => {
    expect(() =>
      validateEnvironment({
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/food_recipes',
        JWT_SECRET: jwtSecret,
      }),
    ).toThrow(/JWT_SECRET/);
  });

  it('accepts a random-looking secret that contains a placeholder marker', () => {
    expect(() =>
      validateEnvironment({
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/food_recipes',
        JWT_SECRET: 'aB7!secret!qL2@vN8#xR4$kM6%pT9&zC3^wF5*',
      }),
    ).not.toThrow();
  });

  it('accepts production Brevo configuration when sender and public web URL are present', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/food_recipes',
        JWT_SECRET: 'aB7!secret!qL2@vN8#xR4$kM6%pT9&zC3^wF5*',
        BREVO_API_KEY: 'brevo-test-key',
        AUTH_MAIL_FROM_EMAIL: 'no-reply@recipes.example.test',
        AUTH_PUBLIC_WEB_URL: 'https://recipes.example.test',
      }),
    ).not.toThrow();
  });

  it('rejects production without the Brevo API key', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/food_recipes',
        JWT_SECRET: 'aB7!secret!qL2@vN8#xR4$kM6%pT9&zC3^wF5*',
        AUTH_PUBLIC_WEB_URL: 'https://recipes.example.test',
      }),
    ).toThrow(/BREVO_API_KEY.*production/);
  });

  it('rejects production without a sender email', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/food_recipes',
        JWT_SECRET: 'aB7!secret!qL2@vN8#xR4$kM6%pT9&zC3^wF5*',
        BREVO_API_KEY: 'brevo-test-key',
        AUTH_PUBLIC_WEB_URL: 'https://recipes.example.test',
      }),
    ).toThrow(/AUTH_MAIL_FROM_EMAIL.*production/);
  });

  it('rejects an invalid sender email', () => {
    expect(() =>
      validateEnvironment({
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/food_recipes',
        JWT_SECRET: 'aB7!secret!qL2@vN8#xR4$kM6%pT9&zC3^wF5*',
        AUTH_MAIL_FROM_EMAIL: 'not-an-email',
      }),
    ).toThrow(/AUTH_MAIL_FROM_EMAIL.*valid email/);
  });

  it('rejects production without a public web URL for recovery links', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/food_recipes',
        JWT_SECRET: 'aB7!secret!qL2@vN8#xR4$kM6%pT9&zC3^wF5*',
        BREVO_API_KEY: 'brevo-test-key',
        AUTH_MAIL_FROM_EMAIL: 'no-reply@recipes.example.test',
      }),
    ).toThrow(/AUTH_PUBLIC_WEB_URL.*production/);
  });
});
