import { resolveDatabaseUrl } from '../prisma.config';

describe('Prisma config datasource URL', () => {
  it('uses a non-routable URL when DATABASE_URL is absent', () => {
    expect(resolveDatabaseUrl({})).toBe('postgresql://127.0.0.1:1/prisma_offline');
  });

  it('uses DATABASE_URL for real Prisma commands when it is provided', () => {
    const databaseUrl = 'postgresql://db.internal:5432/food_recipes';

    expect(resolveDatabaseUrl({ DATABASE_URL: databaseUrl })).toBe(databaseUrl);
  });
});
