# Cooking journal and leftovers

A private journal entry can hold a rating, notes, and photos after cooking. Recipe detail can show the latest private rating, repeat choice, and notes for the authenticated user; these values remain separate from public recipe reviews.
Leftover batches track their source, recipe, cooked and remaining servings,
preparation and expiry timestamps in the personal user scope. Services define
eligibility and consumption behavior. Legacy household-scoped rows remain in
the database and are filtered out of personal API reads.

## Sources

- [Prisma schema](../../src/backend/prisma/schema.prisma)
- [Journals module](../../src/backend/src/modules/journals/)
- [Leftovers module](../../src/backend/src/modules/leftovers/)
