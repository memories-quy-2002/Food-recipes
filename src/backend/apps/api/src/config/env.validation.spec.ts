import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  it('accepts a local development environment with a database URL and JWT secret', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        PORT: '3000',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/food_recipes',
        JWT_SECRET: 'development-secret-with-enough-length',
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

  it.each([
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
