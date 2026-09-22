# Cooking session and history

A cooking session stores in-progress work so a user can leave and resume.
Completed cooking is recorded in history. The personal history recap aggregates lifetime completed cooks, distinct recipes, and the most-cooked recipe for the authenticated user. A recipe-scoped memory returns the user's lifetime cook count and latest completion, servings, and journal reflection. Sessions track recipe, servings,
current step, status, timestamps, and optional personal plan or leftover
context. Existing saved serving preferences are not changed by the new default. Ingredient usage records required, deducted, and missing quantities.

## Sources

- [Prisma schema](../../src/backend/prisma/schema.prisma)
- [Cooking history module](../../src/backend/src/modules/cooking-history/)
- [History feature](../../src/frontend/features/history/)
- [Recipe cooking memory](../../src/frontend/features/recipes/RecipeCookingMemory.tsx)
