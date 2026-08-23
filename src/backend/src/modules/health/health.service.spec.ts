import { ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns a live status without touching the database', () => {
    const prisma = { $queryRaw: jest.fn() };
    const service = new HealthService(prisma as never);

    expect(service.live()).toEqual({ status: 'ok' });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('returns ready when the database responds', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]) };
    const service = new HealthService(prisma as never);

    await expect(service.ready()).resolves.toEqual({ status: 'ok' });
  });

  it('raises service unavailable when the database is down', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('connection refused')),
    };
    const service = new HealthService(prisma as never);

    await expect(service.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
