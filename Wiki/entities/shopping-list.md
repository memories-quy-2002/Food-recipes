# Shopping list

A shopping list contains items one user plans to buy. Items can be entered
manually or imported from recipe and planning flows. An item stores a label,
optional quantity text, checked state, and optional source recipe. Do not infer
a structured quantity from display text. Legacy household scope columns remain
in the database but are not exposed by personal routes.

## Sources

- [Prisma schema](../../src/backend/prisma/schema.prisma)
- [Planning module](../../src/backend/src/modules/planning/)
- [Shopping feature](../../src/frontend/features/shopping/)
