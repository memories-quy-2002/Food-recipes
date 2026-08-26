import './bootstrap/instrument';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { INestApplication, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { configureCors } from './bootstrap/cors.bootstrap';
import { configureSwagger } from './bootstrap/swagger.bootstrap';
import { createValidationPipe } from './bootstrap/validation.bootstrap';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { requestContextMiddleware } from './common/middleware/request-context.middleware';
import { writeStructuredLog } from './common/logging/structured-logger';

export function configureExceptionFilters(
  app: Pick<INestApplication, 'useGlobalFilters'>,
): void {
  // Nest evaluates the catch-all filter first; keep the Prisma-specific filter second.
  app.useGlobalFilters(new GlobalExceptionFilter(), new PrismaExceptionFilter());
}

export async function createApplication() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const expressApp = app.getHttpAdapter().getInstance() as {
    disable: (name: string) => void;
    use: (middleware: (request: unknown, response: { setHeader: (name: string, value: string) => void }, next: () => void) => void) => void;
  };
  expressApp.disable('x-powered-by');
  const bodyParserApp = app as INestApplication & {
    useBodyParser: (type: 'json' | 'urlencoded', options: { limit: string; extended?: boolean }) => void;
  };
  bodyParserApp.useBodyParser('json', { limit: '256kb' });
  bodyParserApp.useBodyParser('urlencoded', { limit: '256kb', extended: true });
  expressApp.use((_request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'");
    next();
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalPipes(createValidationPipe());
  app.use(requestContextMiddleware);
  configureExceptionFilters(app);
  app.useGlobalInterceptors(new LoggingInterceptor());
  configureCors(app);
  configureSwagger(app);

  return app;
}

async function bootstrap(): Promise<void> {
  const app = await createApplication();
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  writeStructuredLog('info', 'Food Recipes API started', {
    type: 'application_started',
    port,
    environment: process.env.NODE_ENV ?? 'development',
  });
}

if (require.main === module) {
  void bootstrap();
}
