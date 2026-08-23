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

  it('documents unique query parameters, runtime response shapes, and error metadata', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json').expect(200);
    const document = response.body as {
      paths: Record<string, Record<string, {
        parameters?: Array<{ name: string; in?: string }>;
        responses?: Record<string, unknown>;
        security?: Array<Record<string, string[]>>;
      }> >;
      components: {
        schemas: Record<string, {
          properties?: Record<string, { type?: string; nullable?: boolean }>;
          required?: string[];
        }>;
      };
    };

    const recipeList = document.paths['/api/v1/recipes'].get;
    const queryParameterNames = (recipeList.parameters ?? [])
      .filter((parameter) => parameter.in === 'query')
      .map((parameter) => parameter.name);
    expect(queryParameterNames).toEqual(['search', 'categoryId', 'mealId']);
    expect(new Set(queryParameterNames).size).toBe(queryParameterNames.length);

    const recipeSchema = document.components.schemas.RecipeResponseDto;
    expect(recipeSchema.required).not.toEqual(expect.arrayContaining(['ingredients', 'instructions']));
    expect(recipeSchema.properties?.meal_description).toEqual({
      type: 'string',
      nullable: true,
      example: 'Dinner ideas',
    });

    expect(document.components.schemas.ApiErrorResponseDto.properties?.requestId).toEqual({
      type: 'string',
      nullable: true,
      example: 'request-id',
    });
    expect(document.components.schemas.PublicUserResponseDto.properties?.phone).toEqual({
      type: 'string',
      nullable: true,
      example: '+1 555 0100',
    });
    expect(document.components.schemas.PublicUserResponseDto.properties?.address).toEqual({
      type: 'string',
      nullable: true,
      example: 'London',
    });
    expect(document.components.schemas.RecipeResponseDto.properties?.recipe_description).toEqual({
      type: 'string',
      nullable: true,
      example: 'A quick weeknight pasta.',
    });
    expect(document.components.schemas.RecipeResponseDto.properties?.image_url).toEqual({
      type: 'string',
      nullable: true,
      example: 'https://example.com/pasta.jpg',
    });
    expect(document.components.schemas.PublicUserResponseDto.properties?.last_login).toEqual({
      type: 'string',
      format: 'date-time',
      nullable: true,
    });
    expect(document.components.schemas.RecipeResponseDto.properties?.date_added).toEqual({
      type: 'string',
      format: 'date-time',
      nullable: true,
    });
    expect(document.components.schemas.RecipeResponseDto.properties?.full_name).toEqual({
      type: 'string',
      nullable: true,
      example: 'Ada Lovelace',
    });
    expect(document.components.schemas.RatingResponseDto.properties?.review).toEqual({
      type: 'string',
      nullable: true,
      example: 'Delicious!',
    });
    expect(document.components.schemas.ReviewResponseDto.properties?.review).toEqual({
      type: 'string',
      nullable: true,
      example: 'Delicious!',
    });
    expect(document.components.schemas.RatingRemovalResponseDto.properties?.message).toEqual({
      type: 'string',
      example: 'Rating removed successfully',
    });

    expect(document.paths['/api/v1/recipes/{id}'].get.responses).toHaveProperty('400');
    expect(document.paths['/api/v1/recipes'].post.responses).toHaveProperty('401');
    expect(document.paths['/api/v1/users/me/recipes'].get.responses).toHaveProperty('401');
    expect(document.paths['/api/v1/recipes/{recipeId}/reviews'].get.responses).toHaveProperty('400');
    expect(document.paths['/api/v1/users/me/wishlist/{recipeId}'].delete.responses).toEqual(
      expect.objectContaining({ '400': expect.anything(), '401': expect.anything() }),
    );
    expect(document.paths['/api/v1/recipes'].get.security).toBeUndefined();
    expect(document.paths['/api/v1/recipes/{recipeId}/reviews'].get.security).toBeUndefined();
    expect(document.paths['/api/v1/users/me/recipes'].get.security).toEqual([{ bearer: [] }]);
  });
});
