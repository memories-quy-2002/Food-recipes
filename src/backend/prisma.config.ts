import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export const OFFLINE_DATABASE_URL = 'postgresql://127.0.0.1:1/prisma_offline';

export const resolveDatabaseUrl = (
  environment: { DATABASE_URL?: string } = process.env,
): string => environment.DATABASE_URL?.trim() || OFFLINE_DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'corepack pnpm@11.18.0 exec ts-node --transpile-only prisma/seed.ts',
  },
  datasource: {
    url: resolveDatabaseUrl(),
  },
});
