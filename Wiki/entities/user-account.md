# User account

A user account owns private profile data, authored recipes, saved collections,
meal plans, shopping items, pantry inventory, cooking sessions, history,
leftovers, and private journals. The backend scopes private API reads and
writes to the authenticated user. Public recipes remain community content and
are separate from account-owned activity.

The Prisma schema still contains household membership, invitation, and
nullable kitchen-scope fields from the previous group feature. They are
retained as legacy data: current controllers and frontend flows do not expose
them, and personal queries exclude group-scoped rows. Do not delete or reassign
that data without an approved backup and retention plan.

## Sources

- [Prisma schema](../../src/backend/prisma/schema.prisma)
- [Authentication module](../../src/backend/src/modules/auth/)
- [Current API contract](../../docs/backend/current-api-contract.md)