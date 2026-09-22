# Refactor workflow

Use this prompt when the user requests simplification while preserving
Food Recipes behavior.

## Task input

- Target files or feature:
- Current cost, duplication, or complexity:
- Desired improvement:
- Behavior that must remain unchanged:

## Instructions

1. Follow the shared task contract in [README.md](./README.md). Inspect the
   owning source, its callers, current docs, and relevant package configuration.
2. Check the branch and worktree. Preserve existing edits and keep unrelated
   files untouched.
3. Identify the concrete code boundary being simplified and the observable
   behavior that must remain stable.
4. Keep routes, payloads, validation, permissions, data, UI states, and
   persistence unchanged unless the user explicitly includes a behavior change.
5. Prefer a feature-local refactor. Do not introduce an abstraction, package,
   dependency, or broad restructuring without a demonstrated need.
6. Keep frontend and backend package boundaries intact. Follow existing
   frontend feature/shared and NestJS controller/service/repository boundaries.
7. If the request discovers an actual defect, report it separately and do not
   silently mix a behavior fix into the refactor.
8. Add or run checks only when the user asks for testing or verification.
   Report exactly what was and was not verified.