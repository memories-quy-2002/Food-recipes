import { JwtService } from '@nestjs/jwt';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

type SqlQuery = {
  strings: readonly string[];
  values: readonly unknown[];
};

describe('Ratings module wiring', () => {
  const database = {
    user: {
      findUnique: jest.fn(async ({ where }: { where: { id?: number; email?: string } }) => {
        const id = where.id ?? 7;
        return {
          id,
          fullName: id === 42 ? 'Recipe Author' : 'Ada Cook',
          password: 'unused-in-ratings-e2e',
          email: where.email ?? (id === 42 ? 'author@example.com' : 'ada@example.com'),
          createdOn: new Date('2026-01-01T00:00:00.000Z'),
          lastLogin: null,
          phone: null,
          address: null,
          role: 'user',
          emailVerifiedAt: null,
        };
      }),
    },
    $queryRaw: jest.fn(async (query: SqlQuery) => {
      const sql = query.strings.join(' ').replace(/\s+/g, ' ');
      if (sql.includes('SELECT user_id') && sql.includes('FROM recipes')) {
        return [{ user_id: 42 }];
      }
      if (sql.includes('INSERT INTO rating')) {
        return [{ overall_score: 5, num_ratings: 1 }];
      }
      if (sql.includes('DELETE FROM rating')) {
        return [{ overall_score: 0, num_ratings: 0 }];
      }
      if (sql.includes('SELECT rt.rating_id')) {
        return [];
      }
      if (sql.includes('COALESCE')) {
        return [{ overall_score: 0, num_ratings: 0 }];
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    }),
  };

  let app: import('@nestjs/common').INestApplication;
  let jwtService: JwtService;
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeAll(async () => {
    process.env.JWT_SECRET = '4hP!8vC#1nQ@6zM$3rT%9xL&7kD^2wF*';
    process.env.DATABASE_URL = 'postgresql://user:password@127.0.0.1:5432/food_recipes';
    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(database)
      .compile();

    app = moduleRef.createNestApplication();
    jwtService = moduleRef.get(JwtService, { strict: false });
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it('enforces the real JWT guard for protected ratings routes', async () => {
    await request(app.getHttpServer())
      .put('/api/v1/recipes/15/rating')
      .send({ score: 5 })
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/v1/users/me/ratings')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);
  });

  it('uses the JWT subject through the real module and controllers', async () => {
    const token = await jwtService.signAsync({ sub: 7, email: 'ada@example.com' });

    await request(app.getHttpServer())
      .put('/api/v1/recipes/15/rating')
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 5, review: 'Great' })
      .expect(200)
      .expect({
        message: 'Rating saved successfully',
        aggregate: { overall_score: 5, num_ratings: 1 },
      });

    await request(app.getHttpServer())
      .put('/api/v1/recipes/15/rating')
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 4, review: 'Updated' })
      .expect(200)
      .expect({
        message: 'Rating saved successfully',
        aggregate: { overall_score: 5, num_ratings: 1 },
      });

    await request(app.getHttpServer())
      .delete('/api/v1/recipes/15/rating')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({
        message: 'Rating removed successfully',
        aggregate: { overall_score: 0, num_ratings: 0 },
      });

    await request(app.getHttpServer())
      .get('/api/v1/users/me/ratings')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ ratings: [] });

    const queries = database.$queryRaw.mock.calls.map(([query]) => query as SqlQuery);
    const upserts = queries.filter((query) =>
      query.strings.join(' ').includes('INSERT INTO rating'),
    );
    expect(upserts).toHaveLength(2);
    expect(upserts[1].values).toEqual([7, 4, 'Updated', 15, 15]);
  });

  it('rejects an invalid score at the HTTP boundary', async () => {
    const token = await jwtService.signAsync({ sub: 7, email: 'ada@example.com' });

    await request(app.getHttpServer())
      .put('/api/v1/recipes/15/rating')
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 6 })
      .expect(400);
  });

  it('rejects a recipe author self-review with 403', async () => {
    const token = await jwtService.signAsync({ sub: 42, email: 'author@example.com' });

    await request(app.getHttpServer())
      .put('/api/v1/recipes/15/rating')
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 5, review: 'My own recipe' })
      .expect(403);
  });

  it('rejects a review over the configured maximum length', async () => {
    const token = await jwtService.signAsync({ sub: 7, email: 'ada@example.com' });

    await request(app.getHttpServer())
      .put('/api/v1/recipes/15/rating')
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 5, review: 'x'.repeat(2001) })
      .expect(400);
  });

  it('rejects null reviews at the HTTP boundary', async () => {
    const token = await jwtService.signAsync({ sub: 7, email: 'ada@example.com' });

    await request(app.getHttpServer())
      .put('/api/v1/recipes/15/rating')
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 5, review: null })
      .expect(400);
  });

  it('keeps recipe reviews public', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/recipes/15/reviews')
      .expect(200)
      .expect({ reviews: [], aggregate: { overall_score: 0, num_ratings: 0 } });
    const queries = database.$queryRaw.mock.calls.map(([query]) => query as SqlQuery);
    expect(queries.some((query) => query.values.includes(15))).toBe(true);
  });
});
