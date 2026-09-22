# Right-sized BMad planning for Food Recipes

Last reviewed: 2026-09-22

This directory contains Food Recipes planning templates inspired by the BMad
Method. It is a lightweight, repository-specific workflow. The templates are
ordinary Markdown files; their presence does not mean that BMad commands,
skills, agents, or an external service are installed.

Follow [AGENTS.md](../../AGENTS.md), [docs/README.md](../README.md), and
[Wiki/index.md](../../Wiki/index.md) first. This guide supplements those
instructions and does not replace them. The current code, schema, tests, and
checked-in contracts remain the evidence for what the product does.

## Pick the smallest useful path

| Change shape | Planning path |
| --- | --- |
| Clear, low-risk, one-session change such as a narrow fix, small UI adjustment, or docs edit | Work directly with the matching [AI task prompt](../ai-prompts/README.md). Create no planning artifact. |
| A bounded feature with a few affected layers or important acceptance details | Write a short intent and acceptance criteria. Use the PRD template only if scope or success needs to be explicit. |
| Unclear or cross-cutting work involving multiple features/packages, public API, database schema, migrations, auth, ownership, or significant operational impact | Use the affected templates below: PRD or spec, architecture note, session-sized stories, and relevant QA checks. |
| A new product area or multi-epic initiative | Establish the product outcome and constraints, plan only the necessary product/UX/architecture decisions, then split delivery into epics and stories. |

Risk, ambiguity, and coordination matter as much as feature size. Use more
planning when different choices would change user-visible behavior, data
integrity, security, compatibility, or production operations. Do not create
documents just to fill a process.

## Workflow

1. **Inspect the existing project.** Read the required indexes and current
   guides, inspect the working tree, and follow the affected behavior through
   source, API contracts, schema, tests, and configuration. Avoid copying
   details the code and current guides already provide.
2. **Write the intent.** State the user problem, outcome, acceptance criteria,
   constraints, non-goals, affected users, and unresolved decisions. Keep
   quoted task material separate from instructions.
3. **Resolve material choices.** Record alternatives and trade-offs in an
   architecture note when more than one viable design exists. Mark it Proposed
   until the user approves the decision; record an accepted durable choice in
   the [Wiki decision log](../../Wiki/decisions/README.md).
4. **Break down only multi-session work.** Make each story a coherent,
   verifiable user outcome with dependencies and explicit scope. Start with
   foundational or risky work, then verify cross-story integration.
5. **Implement within the approved scope.** Preserve unrelated working-tree
   changes and existing API, auth, ownership, data, and delivery contracts
   unless the user requests a change.
6. **Verify at the requested boundary.** Select package-local commands and
   user journeys from [AGENTS.md](../../AGENTS.md) and current docs. Record the
   exact commands and results; separate static, unit, mocked-browser,
   real-API, database, and production evidence.
7. **Close the documentation loop.** Update current developer docs when
   procedures or contracts change. Update the Wiki for durable behavior or
   confirmed decisions. Keep completed plans in the archive rather than
   presenting them as active instructions.

## Food Recipes planning boundaries

- Frontend and backend are independent pnpm packages. There is no root
  workspace. Keep frontend domain behavior in feature folders and shared UI
  or API helpers in shared folders only when genuinely reusable.
- The backend is NestJS, Prisma, and PostgreSQL. Keep controllers focused on
  HTTP, business rules in services, and persistence in repositories.
- The versioned API is under /api/v1. Preserve current DTOs, compatibility
  behavior, refresh-cookie flows, and ownership checks unless the approved
  outcome changes them.
- Personal resource ownership belongs on the server. The product supports one
  personal kitchen per account. For schema changes, inspect existing data and
  migration history; legacy group tables and records are retained until a safe
  data-retention plan is approved. Never assume a production reset is acceptable.
- CI and deployment facts belong in [CI/CD operations](../ci-cd.md). CI
  PostgreSQL is disposable. A successful CI database run is not production
  evidence. The API image is built in CI, but this repository does not publish
  or deploy it.
- When research is requested, use primary sources and cite them. Treat generic
  best practices as candidates to evaluate against the current system.

## Templates

- [Product brief](./product-brief.md) records the current product baseline.
  Update it only when the durable product intent changes.
- [PRD](./prd-template.md) makes uncertain outcomes, scope, and acceptance
  explicit.
- [Architecture note](./architecture-template.md) records a real decision
  boundary and its trade-offs.
- [Story](./story-template.md) splits multi-session work into verifiable units.
- [QA checklist](./qa-checklist.md) selects checks that apply; unchecked or
  unrun items are not evidence of success.

Keep only artifacts that help someone make or verify a decision. Do not copy
the whole project brief, API contract, or architecture guide into every task.

## BMad Method references

The current BMad guidance recommends adapting planning to intent size,
starting from existing project context, and using session-sized implementation
units. These references were reviewed on 2026-09-22:

- [Choose a Planning Path](https://docs.bmad-method.org/cs/plan/choose-a-planning-path/)
- [Start in an Existing Codebase](https://docs.bmad-method.org/existing-codebases/start-in-an-existing-codebase/)
- [Set and Maintain Project Context](https://docs.bmad-method.org/existing-codebases/set-and-maintain-project-context/)
- [Build a Change](https://docs.bmad-method.org/cs/build/build-a-change/)

If an installed BMad workflow is used, verify its current command names and
behavior in that environment first. Do not assume a template in this directory
is an executable BMad workflow.