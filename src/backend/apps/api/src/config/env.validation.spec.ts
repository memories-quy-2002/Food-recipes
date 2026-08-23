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
        JWT_SECRET: 'development-secret-with-enough-length',
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
  ])('rejects the placeholder JWT secret %s', (jwtSecret) => {
    expect(() =>
      validateEnvironment({
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/food_recipes',
        JWT_SECRET: jwtSecret,
      }),
    ).toThrow(/JWT_SECRET/);
  });
});
