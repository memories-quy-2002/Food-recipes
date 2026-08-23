export type Environment = Record<string, unknown>;

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const JWT_PLACEHOLDER_PATTERN =
  /(?:^|[^a-z0-9])(?:replace[-_\s]?with|change[-_\s]?me|generate|dev|development|test|testing|local|localhost|default|example|sample|dummy|fake|placeholder|secret|password)(?:$|[^a-z0-9])/i;

export function validateEnvironment(environment: Environment): Environment {
  const databaseUrl = asString(environment.DATABASE_URL);
  const jwtSecret = asString(environment.JWT_SECRET);

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  if (
    !jwtSecret ||
    jwtSecret.length < 32 ||
    JWT_PLACEHOLDER_PATTERN.test(jwtSecret)
  ) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters and must not be a placeholder',
    );
  }

  const rawPort = environment.PORT ?? '3000';
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return {
    ...environment,
    NODE_ENV: asString(environment.NODE_ENV) ?? 'development',
    PORT: port,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    CORS_ORIGINS: asString(environment.CORS_ORIGINS) ?? 'http://localhost:5173',
  };
}
