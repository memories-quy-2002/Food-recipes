# Food Recipes Wiki

This Wiki records durable product and engineering knowledge. The code and
current developer guides remain the source of truth.

## Start here

- [Overview](./overview.md) - product scope and packages.
- [Architecture](./architecture.md) - frontend, API, data, and security boundaries.
- [Decision records](./decisions/README.md) - how to record confirmed decisions.
- [Knowledge log](./log.md) - append-only Wiki updates.

## Domain pages

### Entities
- [Recipe](./entities/recipe.md)
- [User account](./entities/user-account.md)
- [Pantry item](./entities/pantry-item.md)
- [Meal plan](./entities/meal-plan.md)
- [Shopping list](./entities/shopping-list.md)
- [Cooking session and history](./entities/cooking-session-and-history.md)
- [Saved collection](./entities/saved-collection.md)
- [Cooking journal and leftovers](./entities/cooking-journal-and-leftovers.md)

### Concepts
- [Authentication and ownership](./concepts/authentication-and-ownership.md)
- [Recipe lifecycle](./concepts/recipe-lifecycle.md)
- [Personal kitchen scope](./concepts/personal-kitchen.md)
- [Kitchen continuity](./concepts/kitchen-continuity.md)
- [Recipe URL import](./concepts/recipe-url-import.md)

## Current references
- [Product brief](../docs/bmad/product-brief.md)
- [Current API contract](../docs/backend/current-api-contract.md)
- [Current user journeys](../docs/frontend/current-user-journeys.md)
- [CI/CD and release operations](../docs/ci-cd.md)
- [Sources guide](./sources/README.md)
- [Synthesis guide](./synthesis/README.md)

## Maintenance
- Check current source before changing a page; code, schema, tests, and current API guides are authoritative.
- Link to source files instead of copying implementation details.
- Mark planned or unverified behavior. Do not present archived proposals as shipped features.
- Record confirmed decisions only, and add one dated line to [log.md](./log.md) when the Wiki changes.
