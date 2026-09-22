const requiredEnvironment = (name: string, environment: NodeJS.ProcessEnv): string => {
  const value = environment[name]?.trim();
  if (!value) {
    throw new Error('Missing required production database target value: ' + name);
  }

  return value;
};

export const validateProductionDatabaseTarget = (
  environment: NodeJS.ProcessEnv = process.env,
): URL => {
  const requestedProjectRef = requiredEnvironment('DEMO_DATABASE_TARGET_PROJECT_REF', environment);
  const expectedProjectRef = requiredEnvironment('PRODUCTION_DEMO_PROJECT_REF', environment);
  if (requestedProjectRef !== expectedProjectRef) {
    throw new Error('The requested Supabase project ref is not the configured production database target');
  }

  const databaseUrl = requiredEnvironment('DATABASE_URL', environment);
  const databaseHost = requiredEnvironment('PRODUCTION_DEMO_DB_HOST', environment);
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

  return parsedDatabaseUrl;
};

if (require.main === module) {
  try {
    validateProductionDatabaseTarget();
    console.log('Production database target validated.');
  } catch (error: unknown) {
    console.error('Production database target validation failed:', error);
    process.exitCode = 1;
  }
}
