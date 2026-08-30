import { NotInterestedRepository } from './not-interested.repository';

describe('NotInterestedRepository', () => {
  it('upserts only published recipes for the authenticated user', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ recipe_id: 15 }]), $executeRaw: jest.fn() };
    const repository = new NotInterestedRepository(prisma as never);

    await expect(repository.add(7, 15)).resolves.toBe(true);
    const query = prisma.$queryRaw.mock.calls[0][0];
    const source = query.strings.join(' ');
    expect(source).toMatch(/INSERT INTO recommendation_not_interested/);
    expect(source).toMatch(/status = 'published'/);
    expect(source).toMatch(/ON CONFLICT/);
    expect(source).toMatch(/user_id/);
  });

  it('deletes idempotently within the authenticated user scope', async () => {
    const prisma = { $queryRaw: jest.fn(), $executeRaw: jest.fn().mockResolvedValue(0) };
    const repository = new NotInterestedRepository(prisma as never);

    await expect(repository.remove(7, 15)).resolves.toBe(false);
    const query = prisma.$executeRaw.mock.calls[0][0];
    expect(query.strings.join(' ')).toMatch(/user_id/);
    expect(query.strings.join(' ')).toMatch(/recipe_id/);
  });

  it('does not treat an unpublished recipe as a valid PUT target', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]), $executeRaw: jest.fn() };
    const repository = new NotInterestedRepository(prisma as never);

    await expect(repository.add(7, 15)).resolves.toBe(false);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    expect(prisma.$queryRaw.mock.calls[1][0].strings.join(' ')).toMatch(/status = 'published'/);
  });
});
