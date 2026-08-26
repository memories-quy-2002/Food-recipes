import * as Sentry from '@sentry/nestjs';

const DEFAULT_TRACE_SAMPLE_RATE = 0.05;

const parseSampleRate = (value: string | undefined): number => {
  const parsed = Number(value ?? DEFAULT_TRACE_SAMPLE_RATE);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
    ? parsed
    : DEFAULT_TRACE_SAMPLE_RATE;
};

const dsn = process.env.SENTRY_DSN?.trim();
const enabled = Boolean(dsn) && process.env.NODE_ENV !== 'test';

if (enabled) {
  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT?.trim() ||
      process.env.NODE_ENV?.trim() ||
      'production',
    release: process.env.SENTRY_RELEASE?.trim() || undefined,
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE),
    sendDefaultPii: false,
  });
}

export type SentryErrorContext = {
  requestId?: string | null;
  method?: string;
  path?: string;
  statusCode?: number;
};

export const captureSentryException = (
  exception: unknown,
  context: SentryErrorContext = {},
): void => {
  if (!enabled) return;

  Sentry.withScope((scope) => {
    if (context.requestId) scope.setTag('request_id', context.requestId);
    if (context.method) scope.setTag('http.method', context.method);
    if (context.statusCode !== undefined) {
      scope.setTag('http.status_code', String(context.statusCode));
    }
    if (context.path || context.method || context.statusCode !== undefined) {
      scope.setContext('request', {
        method: context.method,
        path: context.path,
        statusCode: context.statusCode,
      });
    }
    Sentry.captureException(exception);
  });
};
