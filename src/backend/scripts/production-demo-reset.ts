import 'dotenv/config';

import { spawn } from 'node:child_process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const RESET_CONFIRMATION = 'RESET_FOOD_RECIPES_PRODUCTION';
const BACKUP_CONFIRMATION = 'BACKUP_VERIFIED';
const STORAGE_BATCH_SIZE = 1000;
const STORAGE_PAGE_SIZE = 1000;

const APPLICATION_TABLES = [
  'accounts',
  'categories',
  'meals',
  'recipes',
  'recipe_ingredients',
  'recipe_nutrition',
  'recipe_dietary_tags',
  'wishlist',
  'rating',
  'saved_collections',
  'saved_collection_items',
  'review_reports',
  'recipe_allergens',
  'recipe_notes',
  'pantry_items',
  'meal_plans',
  'meal_plan_items',
  'shopping_list_items',
  'auth_sessions',
  'password_reset_tokens',
  'email_verification_tokens',
] as const;

const PROTECTED_NAMES = ['_prisma_migrations', 'auth', 'storage'] as const;

type StorageObject = {
  id?: string | null;
  name?: string;
};

type StorageRequestOptions = {
  body?: unknown;
  method?: 'DELETE' | 'POST';
};

const requiredEnvironment = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required production demo reset environment variable: ${name}`);
  }

  return value;
};

const validateConfiguration = (): URL => {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('Production demo reset requires NODE_ENV=production');
  }

  if (process.env.PRODUCTION_DEMO_RESET_ENABLED !== 'true') {
    throw new Error('Production demo reset is disabled by PRODUCTION_DEMO_RESET_ENABLED');
  }

  if (process.env.DEMO_RESET_CONFIRM !== RESET_CONFIRMATION) {
    throw new Error(`Type ${RESET_CONFIRMATION} to confirm the production reset`);
  }

  if (process.env.DEMO_RESET_BACKUP_CONFIRMED !== BACKUP_CONFIRMATION) {
    throw new Error(`Type ${BACKUP_CONFIRMATION} after verifying a recoverable backup`);
  }

  const requestedProjectRef = requiredEnvironment('DEMO_RESET_PROJECT_REF');
  const expectedProjectRef = requiredEnvironment('PRODUCTION_DEMO_PROJECT_REF');
  if (requestedProjectRef !== expectedProjectRef) {
    throw new Error('The requested Supabase project ref is not the configured production demo target');
  }

  const databaseUrl = requiredEnvironment('DATABASE_URL');
  const databaseHost = requiredEnvironment('PRODUCTION_DEMO_DB_HOST');
  let parsedDatabaseUrl: URL;
  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL');
  }

  if (parsedDatabaseUrl.protocol !== 'postgresql:' && parsedDatabaseUrl.protocol !== 'postgres:') {
    throw new Error('DATABASE_URL must use the PostgreSQL protocol');
  }

  if (parsedDatabaseUrl.hostname !== databaseHost) {
    throw new Error('DATABASE_URL does not match PRODUCTION_DEMO_DB_HOST');
  }

  if (
    APPLICATION_TABLES.some((tableName) => PROTECTED_NAMES.includes(tableName as (typeof PROTECTED_NAMES)[number]))
  ) {
    throw new Error('The application table allowlist contains a protected table or schema');
  }

  return parsedDatabaseUrl;
};

const quoteIdentifier = (value: string): string => `"${value.replaceAll('"', '""')}"`;

const truncateApplicationTables = async (databaseUrl: URL): Promise<void> => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl.toString() }),
  });

  try {
    await prisma.$transaction(
      async (client) => {
        await client.$executeRawUnsafe("SET LOCAL lock_timeout = '30s'");
        await client.$executeRawUnsafe("SET LOCAL statement_timeout = '5min'");
        await client.$queryRawUnsafe(
          "SELECT pg_advisory_xact_lock(hashtext('food_recipes_production_demo_reset'))",
        );
        await client.$executeRawUnsafe(
          `TRUNCATE TABLE ${APPLICATION_TABLES.map(quoteIdentifier).join(', ')} RESTART IDENTITY CASCADE`,
        );
      },
      { maxWait: 30_000, timeout: 5 * 60_000 },
    );
  } finally {
    await prisma.$disconnect();
  }
};

const storageHeaders = (): Record<string, string> => {
  const serviceRoleKey = requiredEnvironment('SUPABASE_SERVICE_ROLE_KEY');
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  };
};

const storageRequest = async <T>(
  url: string,
  options: StorageRequestOptions,
): Promise<T> => {
  const response = await fetch(url, {
    method: options.method ?? 'POST',
    headers: storageHeaders(),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase Storage request failed with ${response.status}: ${message.slice(0, 300)}`);
  }

  return (await response.json()) as T;
};

const listStorageObjects = async (
  storageBaseUrl: string,
  bucket: string,
  prefix = '',
): Promise<string[]> => {
  const paths: string[] = [];
  let offset = 0;

  while (true) {
    const entries = await storageRequest<StorageObject[]>(
      `${storageBaseUrl}/object/list/${encodeURIComponent(bucket)}`,
      {
        body: {
          prefix: prefix || undefined,
          limit: STORAGE_PAGE_SIZE,
          offset,
          sortBy: { column: 'name', order: 'asc' },
        },
      },
    );

    if (!Array.isArray(entries)) {
      throw new Error('Supabase Storage list response was not an array');
    }

    for (const entry of entries) {
      if (!entry.name) {
        continue;
      }

      const objectPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id == null) {
        paths.push(...(await listStorageObjects(storageBaseUrl, bucket, objectPath)));
      } else {
        paths.push(objectPath);
      }
    }

    if (entries.length < STORAGE_PAGE_SIZE) {
      break;
    }

    offset += entries.length;
  }

  return paths;
};

const clearStorageBucket = async (): Promise<void> => {
  const baseUrl = requiredEnvironment('SUPABASE_URL').replace(/\/+$/, '') + '/storage/v1';
  const bucket = requiredEnvironment('SUPABASE_RECIPE_BUCKET');
  const objectPaths = await listStorageObjects(baseUrl, bucket);

  for (let index = 0; index < objectPaths.length; index += STORAGE_BATCH_SIZE) {
    const batch = objectPaths.slice(index, index + STORAGE_BATCH_SIZE);
    await storageRequest(`${baseUrl}/object/${encodeURIComponent(bucket)}`, {
      method: 'DELETE',
      body: { prefixes: batch },
    });
  }

  console.log(`Cleared ${objectPaths.length} objects from Supabase Storage bucket ${bucket}`);
};

const runSeed = async (): Promise<void> => {
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, ['prisma:seed'], {
      env: process.env,
      stdio: 'inherit',
    });

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Prisma demo seed exited with ${signal ? `signal ${signal}` : `code ${code}`}`));
    });
  });
};

export const main = async (): Promise<void> => {
  const databaseUrl = validateConfiguration();
  await truncateApplicationTables(databaseUrl);
  await runSeed();

  if (process.env.DEMO_RESET_STORAGE === 'true') {
    await clearStorageBucket();
  } else {
    console.log('Supabase Storage cleanup skipped because DEMO_RESET_STORAGE is not true');
  }
};

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error('Production demo reset failed:', error);
    process.exitCode = 1;
  });
}
