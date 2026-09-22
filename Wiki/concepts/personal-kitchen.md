# Personal kitchen scope

Each signed-in user has one personal kitchen. Planning, shopping, pantry,
leftovers, cooking sessions, history, and journals are private to that account.
The backend uses the authenticated user identity for ownership checks; the
frontend does not choose a shared kitchen scope.

Public recipe discovery, publishing, ratings, and reviews remain community
features. Saving a recipe, adding private notes, and cooking it are individual
account activity.

The database retains legacy household tables and nullable scope columns so old
records are not deleted or silently reassigned. Personal endpoints exclude
legacy group-scoped rows. Schema retirement requires a separate backup and
data-retention plan.

## Sources

- [Planning module](../../src/backend/src/modules/planning/)
- [Pantry module](../../src/backend/src/modules/pantry/)
- [Leftovers module](../../src/backend/src/modules/leftovers/)
- [Cooking history module](../../src/backend/src/modules/cooking-history/)
- [Current API contract](../../docs/backend/current-api-contract.md)