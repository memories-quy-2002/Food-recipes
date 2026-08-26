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

const asOptionalRate = (value: unknown, name: string): number | undefined => {
  const candidate = asString(value);
  if (!candidate) return undefined;

  const rate = Number(candidate);
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    throw new Error(`${name} must be a number between 0 and 1`);
  }

  return rate;
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
  const sentryDsn = asOptionalHttpUrl(environment.SENTRY_DSN, 'SENTRY_DSN');
  const sentryEnvironment = asString(environment.SENTRY_ENVIRONMENT);
  const sentryRelease = asString(environment.SENTRY_RELEASE);
  const sentryTracesSampleRate = asOptionalRate(
    environment.SENTRY_TRACES_SAMPLE_RATE,
    'SENTRY_TRACES_SAMPLE_RATE',
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
    ...(sentryDsn ? { SENTRY_DSN: sentryDsn } : {}),
    ...(sentryEnvironment ? { SENTRY_ENVIRONMENT: sentryEnvironment } : {}),
    ...(sentryRelease ? { SENTRY_RELEASE: sentryRelease } : {}),
    ...(sentryTracesSampleRate !== undefined
      ? { SENTRY_TRACES_SAMPLE_RATE: sentryTracesSampleRate }
      : {}),
  };
}
