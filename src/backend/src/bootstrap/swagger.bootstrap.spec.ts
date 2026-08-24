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
    process.env.JWT_SECRET = '9qV!2mR#7xL@4pN$8cT%1wH&6jK^3sF*';
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
      'POST /api/v1/auth/refresh',
      'POST /api/v1/auth/logout',
      'POST /api/v1/auth/forgot-password',
      'POST /api/v1/auth/reset-password',
      'POST /api/v1/auth/verify-email',
      'POST /api/v1/auth/resend-verification',
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
      'PUT /api/v1/recipes/{id}/ingredients',
      'PUT /api/v1/recipes/{id}/nutrition',
      'PUT /api/v1/recipes/{id}/dietary-tags',
      'POST /api/v1/recipes/{id}/publish',
      'POST /api/v1/recipes/{id}/archive',
      'POST /api/v1/recipes/{id}/restore',
      'GET /api/v1/categories',
      'GET /api/v1/meals',
      'GET /api/v1/users/me/recipes',
      'POST /api/v1/users/me/recipes/drafts',
      'PUT /api/v1/recipes/{recipeId}/rating',
      'DELETE /api/v1/recipes/{recipeId}/rating',
      'GET /api/v1/recipes/{recipeId}/reviews',
      'GET /api/v1/users/me/ratings',
      'GET /api/v1/users/me/wishlist',
      'POST /api/v1/users/me/wishlist',
      'DELETE /api/v1/users/me/wishlist/{recipeId}',
      'GET /api/v1/users/me/collections',
      'POST /api/v1/users/me/collections',
      'PATCH /api/v1/users/me/collections/{collectionId}',
      'DELETE /api/v1/users/me/collections/{collectionId}',
      'GET /api/v1/users/me/collections/{collectionId}/recipes',
      'POST /api/v1/users/me/collections/{collectionId}/recipes',
      'DELETE /api/v1/users/me/collections/{collectionId}/recipes/{recipeId}',
      'POST /api/v1/recipes/{recipeId}/reviews/{ratingId}/report',
      'GET /api/v1/admin/review-reports',
      'PATCH /api/v1/admin/review-reports/{reportId}',
      'GET /api/v1/users/me/meal-plans',
      'POST /api/v1/users/me/meal-plans',
      'GET /api/v1/users/me/meal-plans/{planId}',
      'PATCH /api/v1/users/me/meal-plans/{planId}',
      'DELETE /api/v1/users/me/meal-plans/{planId}',
      'POST /api/v1/users/me/meal-plans/{planId}/items',
      'PATCH /api/v1/users/me/meal-plans/{planId}/items/{itemId}',
      'DELETE /api/v1/users/me/meal-plans/{planId}/items/{itemId}',
      'GET /api/v1/users/me/shopping-list',
      'POST /api/v1/users/me/shopping-list/items',
      'PATCH /api/v1/users/me/shopping-list/items/{itemId}',
      'DELETE /api/v1/users/me/shopping-list/items/{itemId}',
      'POST /api/v1/users/me/shopping-list/from-recipe',
      'DELETE /api/v1/users/me/shopping-list/completed',
      'GET /api/v1/users/me/recipes/{recipeId}/note',
      'PATCH /api/v1/users/me/recipes/{recipeId}/note',
      'DELETE /api/v1/users/me/recipes/{recipeId}/note',
      'GET /api/v1/users/me/pantry',
      'POST /api/v1/users/me/pantry',
      'PATCH /api/v1/users/me/pantry/{pantryId}',
      'DELETE /api/v1/users/me/pantry/{pantryId}',
      'POST /api/v1/media/recipe-image/upload-url',
      'GET /api/v1/recipes/{recipeId}/metadata',
      'PUT /api/v1/recipes/{recipeId}/metadata',
      'POST /api/v1/suggestions',
      'POST /api/v1/users/me/suggestions',
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

  it('serves both Swagger UI and the JSON document without a live database', async () => {
    const docsResponse = await request(app.getHttpServer()).get('/docs').expect(200);
    expect(docsResponse.headers['content-type']).toMatch(/text\/html/);
    expect(docsResponse.text).toContain('Swagger UI');

    const jsonResponse = await request(app.getHttpServer()).get('/docs-json').expect(200);
    expect(jsonResponse.headers['content-type']).toMatch(/json/);
    expect(jsonResponse.body).toHaveProperty('openapi');
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
    expect(queryParameterNames).toEqual([
      'q',
      'search',
      'categoryId',
      'mealId',
      'sort',
      'page',
      'limit',
    ]);
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

  it('documents mutation and authenticated-user error responses with the shared error schema', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json').expect(200);
    const document = response.body as {
      paths: Record<string, Record<string, { responses?: Record<string, unknown> }>>;
      components: {
        schemas: Record<string, { properties?: Record<string, unknown> }>;
      };
    };

    const assertSharedErrorResponse = (path: string, method: string, status: number) => {
      const operation = document.paths[path][method];
      const responseMetadata = operation.responses?.[String(status)] as {
        content?: { 'application/json'?: { schema?: { $ref?: string } } };
      };

      expect(responseMetadata).toEqual(expect.objectContaining({
        content: expect.objectContaining({
          'application/json': expect.objectContaining({
            schema: { $ref: '#/components/schemas/ApiErrorResponseDto' },
          }),
        }),
      }));
    };

    const upsertRating = document.paths['/api/v1/recipes/{recipeId}/rating'].put;
    expect(upsertRating.responses).toEqual(expect.objectContaining({ '403': expect.anything(), '404': expect.anything() }));
    assertSharedErrorResponse('/api/v1/recipes/{recipeId}/rating', 'put', 403);
    assertSharedErrorResponse('/api/v1/recipes/{recipeId}/rating', 'put', 404);

    const deleteRating = document.paths['/api/v1/recipes/{recipeId}/rating'].delete;
    expect(deleteRating.responses).toEqual(expect.objectContaining({ '404': expect.anything() }));
    assertSharedErrorResponse('/api/v1/recipes/{recipeId}/rating', 'delete', 404);

    for (const [path, method] of [
      ['/api/v1/auth/me', 'get'],
      ['/api/v1/users/me', 'get'],
      ['/api/v1/users/me/profile', 'put'],
      ['/api/v1/users/me/password', 'put'],
    ]) {
      assertSharedErrorResponse(path, method, 404);
    }

    assertSharedErrorResponse('/api/v1/auth/signup', 'post', 409);
    assertSharedErrorResponse('/api/v1/auth/token', 'post', 404);
    expect(document.components.schemas.WishlistRemovalResponseDto.properties?.message).toEqual({
      type: 'string',
      example: 'Wishlist item removed',
    });
  });

  it('documents the shared internal server error response on every public operation', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json').expect(200);
    const document = response.body as {
      paths: Record<string, Record<string, { responses?: Record<string, unknown> }>>;
    };

    for (const operations of Object.values(document.paths)) {
      for (const operation of Object.values(operations)) {
        const responseMetadata = operation.responses?.['500'] as {
          content?: { 'application/json'?: { schema?: { $ref?: string } } };
        };

        expect(responseMetadata).toEqual(expect.objectContaining({
          content: expect.objectContaining({
            'application/json': expect.objectContaining({
              schema: { $ref: '#/components/schemas/ApiErrorResponseDto' },
            }),
          }),
        }));
      }
    }
  });
});
