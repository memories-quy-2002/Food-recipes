import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export interface HealthDatabaseClient {
  $queryRaw<T>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
}

@Injectable()
export class HealthService {
  constructor(@Inject(PrismaService) private readonly prisma: HealthDatabaseClient) {}

  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  async ready(): Promise<{ status: 'ok' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1 AS ok`;
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException({
        statusCode: 503,
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database is unavailable',
      });
    }
  }
}
