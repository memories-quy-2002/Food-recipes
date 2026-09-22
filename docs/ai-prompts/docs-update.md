# Developer documentation update

Use this prompt when the user asks to update, reconcile, or create maintained
Food Recipes developer documentation.

## Task input

- Documentation topic or files:
- User outcome:
- Relevant behavior or code change:
- External research requested: yes | no

## Instructions

1. Follow the shared task contract in [README.md](./README.md). Read
   [docs/README.md](../README.md), [Wiki/index.md](../../Wiki/index.md), and
   the relevant current docs and Wiki pages.
2. Verify every current-state claim against the checked-in source, schema,
   package scripts, tests, environment examples, Docker configuration, or
   GitHub/Vercel configuration that owns it. Do not infer deployment settings
   or production operations from local configuration alone.
3. Keep maintained docs concise and actionable. Prefer links to the canonical
   guide over duplicated explanations. Mark proposals, assumptions, and
   unverified operations clearly.
4. If the user requests internet research, use
   [source-research.md](./source-research.md). Cite primary sources and explain
   how each accepted recommendation maps to this repository.
5. Update the relevant index when adding or moving a maintained document.
   Keep current docs in docs/ and historical completed plans in docs/archive/.
   Update the Wiki only for durable product or engineering knowledge, following
   [wiki-ingest.md](./wiki-ingest.md).
6. Do not update unrelated code, roadmap items, or deployment operations as a
   side effect.
7. Check changed links and whitespace when requested. Report updated paths,
   source evidence, external references, and unresolved drift.