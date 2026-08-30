import { LeftoversRepository } from './leftovers.repository';

describe('LeftoversRepository provenance', () => {
  it('only exposes recipe-source cooking history as leftover input', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([]) };
    const repository = new LeftoversRepository(prisma as never);

    await expect(repository.findCompletedHistory(7, 44)).resolves.toBeNull();
    expect(prisma.$queryRaw.mock.calls[0][0].strings.join(' ')).toMatch(/h\.source_type\s*=\s*'recipe'/i);
  });
});
