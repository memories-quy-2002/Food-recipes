import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it('constructs a Prisma 7 client with the configured PostgreSQL URL', async () => {
    process.env.DATABASE_URL = 'postgresql://user:password@127.0.0.1:5432/food_recipes';

    const service = new PrismaService();

    expect(typeof service.$connect).toBe('function');
    await service.$disconnect();
  });
});
