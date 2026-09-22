# AI task prompts

Last reviewed: 2026-09-22

These files are reusable task prompts for people and AI assistants working on
Food Recipes. They are reference material; they are not automatically loaded
agent instructions or installed skills. Follow the repository rules in
[AGENTS.md](../../AGENTS.md) first. A selected prompt helps structure one task
and never expands the user request.

## Choose a workflow

| Request | Prompt |
| --- | --- |
| Implement a bounded product change | [feature.md](./feature.md) |
| Diagnose or fix a defect | [bugfix.md](./bugfix.md) |
| Simplify code without changing behavior | [refactor.md](./refactor.md) |
| Inspect a change or report findings | [review.md](./review.md) |
| Add or run focused verification when requested | [test.md](./test.md) |
| Update current developer documentation | [docs-update.md](./docs-update.md) |
| Add durable product or engineering knowledge | [wiki-ingest.md](./wiki-ingest.md) |
| Research current external guidance when requested | [source-research.md](./source-research.md) |

For larger or unclear work, use the right-sized process in
[docs/bmad/README.md](../bmad/README.md). Do not make every small task go
through planning artifacts.

## Shared task contract

Use these rules with every prompt:

1. Restate the requested user outcome and keep the work inside that scope.
   Record acceptance criteria and non-goals when they affect the implementation.
2. Read [AGENTS.md](../../AGENTS.md), [docs/README.md](../README.md), and
   [Wiki/index.md](../../Wiki/index.md). Follow those indexes to the relevant
   current docs and Wiki pages, then inspect the code, schema, tests, scripts,
   and configuration that own the behavior.
3. Check the current branch and working tree before editing. Preserve existing
   modified and untracked files; do not reset, stage, commit, switch branches,
   or push unless the user requests that action.
4. Treat the current implementation and checked-in contracts as evidence.
   Distinguish shipped behavior, intended changes, assumptions, and open
   decisions. Do not turn an old plan or generic internet advice into a project
   requirement.
5. Prefer the existing feature, API, and UI patterns. Avoid broad refactors,
   new dependencies, duplicate documentation, or speculative architecture.
6. Ask only when a missing decision would materially change user-visible
   behavior, data, security, or delivery. Continue independent work that does
   not depend on the answer.
7. Keep production data changes, destructive operations, deployments, pushes,
   and external communications under the exact authorization the user gave.
8. Match verification to the request and report only commands that actually
   ran. If verification was not requested or could not run, state that plainly;
   do not imply that it passed.
9. Communicate in the user's language. Keep maintained repository docs in
   English, as required by [docs/README.md](../README.md).

## Food Recipes facts to keep in view

- The repository has two independent pnpm packages. There is no root pnpm
  workspace.
- The frontend is React, TypeScript, Vite, React Router, and TanStack Query.
  Domain code belongs in feature folders; cross-feature UI and API helpers
  belong in shared folders when the boundary is real.
- The backend is a NestJS REST API with Prisma and PostgreSQL. Controllers
  handle HTTP; services own business rules; repositories own persistence.
- Authenticated access and personal resource ownership must be enforced by the
  backend. The browser is not authoritative for permissions.
- Preserve the current /api/v1 contract, refresh-cookie behavior, and
  compatibility paths unless the user requests a deliberate change.
- See [architecture](../../Wiki/architecture.md),
  [current API contract](../backend/current-api-contract.md),
  [current user journeys](../frontend/current-user-journeys.md), and
  [CI/CD operations](../ci-cd.md) instead of copying their details into every
  prompt.

## Internet research

Browse when the user asks for current guidance, external facts, or best
practices. Prefer primary sources such as official product documentation and
specifications. Cite the exact pages used, include a review or access date in
maintained docs, and connect each recommendation to a concrete Food Recipes
decision. Label recommendations as optional when they do not follow from the
user's request or the current system. Never replace an existing project
contract with generic advice without checking compatibility.

## Why these prompts are structured this way

The prompts put the task and constraints before supporting context, separate
user input from instructions, and request observable outputs. This reflects
current prompt guidance while keeping repository-wide rules in one
authoritative place.

- [OpenAI: Best practices for prompt engineering](https://help.openai.com/en/articles/6654000-comprehensive-next-generation-prompting)
- [OpenAI: A practical guide to building agents](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/)
- [GitHub: Repository custom instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions)
- [GitHub: Customizing Copilot responses](https://docs.github.com/en/copilot/concepts/prompting/response-customization)
- [AGENTS.md open format](https://github.com/agentsmd/agents.md)

These sources inform the writing approach. Their tool-specific features do not
mean Food Recipes has installed or enabled those tools.