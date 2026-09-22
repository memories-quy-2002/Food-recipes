const databaseUrl = process.env.DATABASE_URL?.trim();
const isComposeTarget = process.argv.includes('--compose');

function fail(message) {
  console.error('Local development database check failed: ' + message);
  process.exit(1);
}

if (!databaseUrl) {
  fail('DATABASE_URL is missing. Set it to a local PostgreSQL URL before running pnpm dev.');
}

let parsedUrl;
try {
  parsedUrl = new URL(databaseUrl);
} catch {
  fail('DATABASE_URL must be a valid PostgreSQL URL.');
}

if (parsedUrl.protocol !== 'postgres:' && parsedUrl.protocol !== 'postgresql:') {
  fail('DATABASE_URL must use the postgres:// or postgresql:// protocol.');
}

const allowedHosts = isComposeTarget
  ? new Set(['postgres'])
  : new Set(['localhost', '127.0.0.1', '[::1]']);
if (!allowedHosts.has(parsedUrl.hostname.toLowerCase())) {
  if (isComposeTarget) {
    fail(
      'Docker Compose migrations only apply to PostgreSQL on the "postgres" service host. ' +
        'Set DATABASE_URL_DOCKER to a URL using postgres as its host.',
    );
  }

  fail(
    'pnpm dev only applies migrations to PostgreSQL on localhost, 127.0.0.1, or ::1. ' +
      'Production migrations must use the manually approved, full-CI-gated workflow.',
  );
}

console.log(
  'Validated local PostgreSQL target (' +
    parsedUrl.hostname +
    (isComposeTarget ? ') for Docker Compose; continuing migration.' : '); continuing development setup.'),
);
