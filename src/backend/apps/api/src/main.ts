import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { configureCors } from './bootstrap/cors.bootstrap';
import { configureSwagger } from './bootstrap/swagger.bootstrap';
import { createValidationPipe } from './bootstrap/validation.bootstrap';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { requestContextMiddleware } from './common/middleware/request-context.middleware';

export async function createApplication() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalPipes(createValidationPipe());
  app.use(requestContextMiddleware);
  app.useGlobalFilters(new PrismaExceptionFilter(), new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  configureCors(app);
  configureSwagger(app);

  return app;
}

async function bootstrap(): Promise<void> {
  const app = await createApplication();
  await app.listen(Number(process.env.PORT ?? 3000));
}

if (require.main === module) {
  void bootstrap();
}
