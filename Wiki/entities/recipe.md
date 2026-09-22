# Recipe

The recipe is the main public content object and the start of saved, planning,
and cooking workflows. The PostgreSQL model includes ownership, descriptive
fields, taxonomy, times, ingredients, instructions, publication state, and
archive timestamps. Related models cover nutrition, dietary tags, allergens,
ratings, reports, and notes.

Public discovery serves published recipes. A URL import creates a private draft
for owner review; it does not publish automatically.

## Sources

- [Prisma schema](../../src/backend/prisma/schema.prisma)
- [Recipe API module](../../src/backend/src/modules/recipes/)
- [Current API contract](../../docs/backend/current-api-contract.md)
