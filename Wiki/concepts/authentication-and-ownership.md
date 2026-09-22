# Authentication and ownership

Authentication establishes who makes a request; authorization decides what
that user can read or change. The backend validates JWT access tokens and
rotates refresh credentials through the configured HttpOnly cookie flow. The
frontend keeps access tokens in memory.

User-owned resources require server-side checks. Kitchen data belongs to the
authenticated account; no shared household kitchen routes are active. Do not
persist browser tokens.

Password recovery and email verification use single-use token endpoints with
generic public responses. Delivery is handled by the backend configuration;
tokens are not exposed in frontend screens. Resending verification requires an
authenticated account.

## Sources

- [Auth module](../../src/backend/src/modules/auth/)
- [Auth feature](../../src/frontend/features/auth/)
- [API client](../../src/frontend/shared/api/axios.ts)
- [API contract](../../docs/backend/current-api-contract.md)