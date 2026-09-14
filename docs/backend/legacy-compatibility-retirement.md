# Legacy compatibility retirement plan

Last reviewed: 2026-09-14

This plan records compatibility paths that are still active in the NestJS API
and frontend. It is a sequencing document, not permission to remove them
immediately. Remove a path only after its exit criteria are demonstrated in a
staging or production-like environment. The current source boundary is the
independent `src/backend` package; `apps/api` and `src/server` are historical
paths and do not exist in the checked-in tree.

## API compatibility

| Legacy surface | Current shape | Exit criteria | Retirement action |
| --- | --- | --- | --- |
| `POST /api/v1/auth/token` with a JWT in the request body | Login returns an access token and protected routes use `Authorization: Bearer` | No mobile, integration, or older frontend client calls the endpoint for one release window | Remove `TokenDto`, the controller method, frontend route constant, fixtures, and contract assertions |
| `POST /api/v1/auth/refresh` body fallback | Browser refresh uses the `food_refresh` HttpOnly cookie | All non-browser clients have moved to the supported session contract | Make `refreshToken` absent from the DTO and require the cookie |
| JWT `user_id` claim | `sub` is the canonical subject claim | All issued tokens have aged beyond the maximum access-token lifetime | Emit and read `sub` only |
| Recipe query parameter `search` | `q` | No requests use `search` in access logs for one release window | Remove the DTO field and repository fallback |
| Frontend `/saved` route | `/wishlist` | No meaningful traffic or support links use `/saved` | Remove the redirect after a bookmark/deprecation window |
| Profile hash aliases | Named profile sections | No old hash links remain in owned documentation or analytics | Remove the aliases and their compatibility test |

The `/auth/refresh` cookie flow, JWT `sub` claim, `q` query parameter, and
`/wishlist` route are current supported behavior. The body refresh token,
legacy `/auth/token`, `search` alias, `/saved` redirect, and old profile hash
aliases remain only for compatibility until their exit criteria are verified.

Before retiring an API path, search the repository, inspect access logs if
available, and check any mobile, partner, or deployed older frontend clients.
Return a deliberate `410 Gone` or a documented `404` only if the API policy
requires a visible retirement response; otherwise remove the route in a
versioned release.

## Recipe data migration

The `recipes.ingredients` string array and interval duration columns are still
used as fallbacks. The structured ingredient rows and minute fields are the
target contract.

1. Back up the database and measure rows missing structured ingredients or
   minute durations.
2. Backfill `recipe_ingredients`, `prep_time_minutes`, and
   `cook_time_minutes`, recording rows that need manual review.
3. Verify create, edit, publish, cooking-session, planning, and public-detail
   flows against the structured/minute fields.
4. Stop dual writes and fallback reads in the Nest repositories and frontend
   normalizers.
5. Deploy a separate reviewed migration that drops the old columns only after
   rollback and restore procedures have been rehearsed.

Keep the initial Prisma migration and `prisma/legacy/recipes.sql` as historical
evidence. They are not runtime compatibility code and should not be rewritten
as part of this migration.

## Frontend response normalization

Normalize snake_case and legacy response variants once in the API parsing
boundary. Then simplify feature contracts and components so they consume only
the canonical fields. This should follow the backend data migration rather
than being done as a broad, unverified type cleanup.

## Verification gate

Every retirement step should include focused API tests, frontend tests for the
affected journey, a migration validation run, and a read-back check against a
seeded database. Keep the compatibility path in place if any external usage or
data gap is found.
