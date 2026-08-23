import { VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureSwagger } from './swagger.bootstrap';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

describe('Swagger document', () => {
  let app: import('@nestjs/common').INestApplication;
  const originalEnvironment = {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    PORT: process.env.PORT,
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://user:password@127.0.0.1:5432/food_recipes';
    process.env.JWT_SECRET = 'task-14-swagger-test-secret-that-is-at-least-32-chars';
    process.env.PORT = '3000';

    const { AppModule } = await import('../app.module');
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: jest.fn() })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    configureSwagger(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    for (const [key, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('publishes the versioned public route inventory and metadata', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json').expect(200);
    const document = response.body as {
      info: { title: string; description: string; version: string };
      paths: Record<string, Record<string, { tags?: string[]; summary?: string; responses?: object }>>;
      components?: {
        securitySchemes?: Record<string, { type?: string; scheme?: string; bearerFormat?: string }>;
        schemas?: Record<string, { properties?: Record<string, unknown> }>;
      };
    };

    const expectedRoutes = [
      'GET /api/v1/health',
      'GET /api/v1/health/live',
      'GET /api/v1/health/ready',
      'POST /api/v1/auth/signup',
      'POST /api/v1/auth/login',
      'GET /api/v1/auth/me',
      'POST /api/v1/auth/token',
      'GET /api/v1/users/me',
      'PUT /api/v1/users/me/profile',
      'PUT /api/v1/users/me/password',
      'GET /api/v1/recipes',
      'GET /api/v1/recipes/{id}',
      'POST /api/v1/recipes',
      'PATCH /api/v1/recipes/{id}',
      'DELETE /api/v1/recipes/{id}',
      'GET /api/v1/users/me/recipes',
      'PUT /api/v1/recipes/{recipeId}/rating',
      'DELETE /api/v1/recipes/{recipeId}/rating',
      'GET /api/v1/recipes/{recipeId}/reviews',
      'GET /api/v1/users/me/ratings',
      'GET /api/v1/users/me/wishlist',
      'POST /api/v1/users/me/wishlist',
      'DELETE /api/v1/users/me/wishlist/{recipeId}',
    ];
    const actualRoutes = Object.entries(document.paths).flatMap(([path, operations]) =>
      Object.keys(operations).map((method) => `${method.toUpperCase()} ${path}`),
    );

    expect(actualRoutes).toEqual(expect.arrayContaining(expectedRoutes));
    expect(actualRoutes).toHaveLength(expectedRoutes.length);
    expect(document.info).toEqual(expect.objectContaining({
      title: 'Food Recipes API',
      description: 'NestJS API for the Food Recipes application',
      version: '1.0',
    }));

    for (const operations of Object.values(document.paths)) {
      for (const operation of Object.values(operations)) {
        expect(operation.tags?.length).toBeGreaterThan(0);
        expect(operation.summary).toBeTruthy();
        expect(Object.keys(operation.responses ?? {}).length).toBeGreaterThan(0);
      }
    }
  });

  it('documents bearer security and representative request DTO schemas', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json').expect(200);
    const document = response.body as {
      paths: Record<string, Record<string, { security?: Array<Record<string, string[]>> }>>;
      components: {
        securitySchemes: Record<string, { type?: string; scheme?: string; bearerFormat?: string }>;
        schemas: Record<string, { properties?: Record<string, unknown> }>;
      };
    };

    expect(document.components.securitySchemes.bearer).toEqual({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter a JWT access token',
    });
    expect(document.paths['/api/v1/auth/me'].get.security).toEqual([{ bearer: [] }]);
    expect(document.paths['/api/v1/auth/signup'].post.security).toBeUndefined();
    expect(document.components.schemas.LoginDto.properties).toHaveProperty('email');
    expect(document.components.schemas.CreateRecipeDto.properties).toHaveProperty('ingredients');
    expect(document.components.schemas.UpsertRatingDto.properties).toHaveProperty('score');
    expect(document.components.schemas.UpdateProfileDto.properties).toHaveProperty('name');
  });
});
