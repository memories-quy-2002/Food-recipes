import { VersioningType, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { RatingsController } from '../src/modules/ratings/ratings.controller';
import { RatingsService } from '../src/modules/ratings/ratings.service';
import { UserRatingsController } from '../src/modules/ratings/user-ratings.controller';

describe('Ratings HTTP contract', () => {
  const service = {
    upsert: jest.fn(),
    remove: jest.fn(),
    listMine: jest.fn(),
    listReviews: jest.fn(),
  };

  let app: import('@nestjs/common').INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RatingsController, UserRatingsController],
      providers: [{ provide: RatingsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: import('@nestjs/common').ExecutionContext) => {
          context.switchToHttp().getRequest().user = { id: 7, email: 'ada@example.com' };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('uses the JWT identity for upsert, delete, and user-owned lookup', async () => {
    service.upsert.mockResolvedValue({
      message: 'Rating saved successfully',
      aggregate: { overall_score: 5, num_ratings: 1 },
    });
    service.remove.mockResolvedValue({
      message: 'Rating removed successfully',
      aggregate: { overall_score: 0, num_ratings: 0 },
    });
    service.listMine.mockResolvedValue({ ratings: [] });

    await request(app.getHttpServer())
      .put('/api/v1/recipes/15/rating')
      .send({ score: 5, review: 'Great', userId: 999 })
      .expect(400);

    await request(app.getHttpServer())
      .put('/api/v1/recipes/15/rating')
      .send({ score: 5, review: 'Great' })
      .expect(200);
    await request(app.getHttpServer())
      .delete('/api/v1/recipes/15/rating')
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/users/me/ratings')
      .expect(200)
      .expect({ ratings: [] });

    expect(service.upsert).toHaveBeenCalledWith(7, 15, { score: 5, review: 'Great' });
    expect(service.remove).toHaveBeenCalledWith(7, 15);
    expect(service.listMine).toHaveBeenCalledWith(7);
  });

  it('rejects an invalid score at the HTTP boundary', async () => {
    await request(app.getHttpServer())
      .put('/api/v1/recipes/15/rating')
      .send({ score: 6 })
      .expect(400);
    expect(service.upsert).not.toHaveBeenCalled();
  });

  it('keeps recipe reviews public', async () => {
    service.listReviews.mockResolvedValue({
      reviews: [],
      aggregate: { overall_score: 0, num_ratings: 0 },
    });

    await request(app.getHttpServer())
      .get('/api/v1/recipes/15/reviews')
      .expect(200)
      .expect({ reviews: [], aggregate: { overall_score: 0, num_ratings: 0 } });
    expect(service.listReviews).toHaveBeenCalledWith(15);
  });
});
