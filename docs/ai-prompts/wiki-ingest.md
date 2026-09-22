# Wiki update workflow

Use this prompt to record durable Food Recipes product or engineering
knowledge, not to mirror implementation details.

## Task input

- Confirmed change or decision:
- Affected domain, contract, or architecture:
- Source files or evidence:
- Planned or unverified behavior, if any:

## Instructions

1. Follow the shared task contract in [README.md](./README.md). Read
   [Wiki/index.md](../../Wiki/index.md), related Wiki pages, current docs, and
   the source that owns the behavior.
2. Verify behavior claims against current code, schema, API DTOs/controllers,
   tests, configuration, or workflow files. Link to those sources instead of
   copying code details.
3. Separate current behavior, confirmed decisions, planned work, and
   assumptions. Label unverified behavior clearly.
4. Add a decision record only for a confirmed choice with lasting product,
   architecture, data, API, or security impact. Check for an existing record
   first and link alternatives and consequences.
5. Update the relevant Wiki page and [index](../../Wiki/index.md) when needed.
   Add one dated summary line to [Wiki/log.md](../../Wiki/log.md) for each Wiki
   change.
6. Do not edit application code through this workflow unless the user also
   requests an implementation.
7. Check links and whitespace for the Wiki changes. Report sources, files
   updated, and any claims that remain unverified.