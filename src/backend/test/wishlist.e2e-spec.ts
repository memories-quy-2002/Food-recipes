import { VersioningType, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { WishlistController } from '../src/modules/wishlist/wishlist.controller';
import { WishlistService } from '../src/modules/wishlist/wishlist.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';

describe('Wishlist HTTP contract', () => {
  const service = {
    list: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
  };

  let app: import('@nestjs/common').INestApplication;

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [WishlistController],
      providers: [
        { provide: WishlistService, useValue: service },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: import('@nestjs/common').ExecutionContext) => {
          context.switchToHttp().getRequest().user = {
            id: 7,
            email: 'ada@example.com',
          };
          return true;
        },
      });
    const moduleRef = await moduleBuilder.compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  it('uses the authenticated JWT user for list, add, and remove routes', async () => {
    service.list.mockResolvedValue({ wishlist: [] });
    service.add.mockResolvedValue({
      recipe: { recipe_id: 15, recipe_name: 'Pasta Carbonara' },
      savedAt: '2026-08-23T06:30:00.000Z',
    });
    service.remove.mockResolvedValue({ message: 'Wishlist item removed' });

    await request(app.getHttpServer())
      .get('/api/v1/users/me/wishlist')
      .expect(200)
      .expect({ wishlist: [] });

    await request(app.getHttpServer())
      .post('/api/v1/users/me/wishlist')
      .send({ recipeId: 15, userId: 999 })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/users/me/wishlist')
      .send({ recipeId: 15 })
      .expect(201)
      .expect({
        recipe: { recipe_id: 15, recipe_name: 'Pasta Carbonara' },
        savedAt: '2026-08-23T06:30:00.000Z',
      });

    await request(app.getHttpServer())
      .delete('/api/v1/users/me/wishlist/15')
      .expect(200)
      .expect({ message: 'Wishlist item removed' });

    expect(service.list).toHaveBeenCalledWith(7, {});
    expect(service.add).toHaveBeenCalledWith(7, 15);
    expect(service.remove).toHaveBeenCalledWith(7, 15);
  });

  it('validates and forwards saved recipe pagination parameters', async () => {
    const result = {
      wishlist: [],
      pagination: { page: 2, limit: 12, total: 13, totalPages: 2, hasNext: false },
    };
    service.list.mockResolvedValue(result);

    await request(app.getHttpServer())
      .get('/api/v1/users/me/wishlist?page=2&limit=12&search=pasta&sort=name')
      .expect(200)
      .expect(result);

    expect(service.list).toHaveBeenCalledWith(7, {
      page: 2,
      limit: 12,
      search: 'pasta',
      sort: 'name',
    });
  });

  it('rejects invalid page sizes and sort values', async () => {
    service.list.mockResolvedValue({ wishlist: [] });

    await request(app.getHttpServer())
      .get('/api/v1/users/me/wishlist?page=0')
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/v1/users/me/wishlist?limit=1000')
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/v1/users/me/wishlist?sort=unknown')
      .expect(400);
  });
});
