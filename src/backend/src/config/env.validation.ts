export type Environment = Record<string, unknown>;

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const asOptionalHttpUrl = (value: unknown, name: string): string | undefined => {
  const candidate = asString(value);
  if (!candidate) return undefined;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${name} must use HTTP or HTTPS`);
  }

  return candidate;
};

const JWT_PLACEHOLDER_PREFIX_PATTERN =
  /^(?:replace[-_\s]?with|change[-_\s]?me|generate|dev|development|test|testing|local|localhost|default|example|sample|dummy|fake|placeholder|secret|password)/i;
const JWT_PREDICTABLE_SHAPE_PATTERN = /^[a-z0-9_-]+$/i;

const isJwtPlaceholder = (jwtSecret: string): boolean =>
  JWT_PREDICTABLE_SHAPE_PATTERN.test(jwtSecret) &&
  JWT_PLACEHOLDER_PREFIX_PATTERN.test(jwtSecret);

export function validateEnvironment(environment: Environment): Environment {
  const databaseUrl = asString(environment.DATABASE_URL);
  const jwtSecret = asString(environment.JWT_SECRET);
  const authMailWebhookUrl = asOptionalHttpUrl(
    environment.AUTH_MAIL_WEBHOOK_URL,
    'AUTH_MAIL_WEBHOOK_URL',
  );
  const authPublicWebUrl = asOptionalHttpUrl(
    environment.AUTH_PUBLIC_WEB_URL,
    'AUTH_PUBLIC_WEB_URL',
  );

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  if (
    !jwtSecret ||
    jwtSecret.length < 32 ||
    isJwtPlaceholder(jwtSecret)
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
    ...(authMailWebhookUrl ? { AUTH_MAIL_WEBHOOK_URL: authMailWebhookUrl } : {}),
    ...(authPublicWebUrl ? { AUTH_PUBLIC_WEB_URL: authPublicWebUrl } : {}),
  };
}
