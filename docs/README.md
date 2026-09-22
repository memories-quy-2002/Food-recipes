# Food Recipes documentation

This directory contains current developer documentation for the Food Recipes
platform.

## Current documentation

- [CI/CD and release operations](./ci-cd.md) - GitHub Actions, Vercel, delivery boundaries, and production database workflows.
- [Production database migrations](./production-migrations.md) - full CI gate, manual Prisma deployment, baseline, and recovery boundaries.
- [Production-quality audit](./audits/2026-09-14-production-quality-audit.md) - a dated audit snapshot with evidence and verification boundaries.
- [Production roadmap](./roadmap.md) - shipped product waves and verified rollout work.
- [Current API contract](./backend/current-api-contract.md) - versioned NestJS routes, authentication rules, and data compatibility constraints.
- [Frontend API cutover matrix](./frontend/api-cutover-matrix.md) - frontend consumers mapped to the current API.
- [Current user journeys](./frontend/current-user-journeys.md) - observable product flows and browser verification coverage.
- [Legacy compatibility retirement](./backend/legacy-compatibility-retirement.md) - evidence-led deprecation rules for compatibility paths.
- [Production demo reset](./production-demo-reset.md) - manual, CI-gated operational runbook.

## Product knowledge and workflows

- [Wiki index](../Wiki/index.md) - current product overview, architecture, domain concepts, entities, and confirmed decisions.
- [AI task prompts](./ai-prompts/README.md) - choose a bounded workflow for feature work, bug fixes, refactors, reviews, tests, or Wiki updates.
- [BMAD workflow](./bmad/README.md) - lightweight planning guidance and templates for product, architecture, or delivery work.
- [Personal-only product scope](./bmad/personal-only-product-scope.md) - confirmed personal kitchen boundary, retained legacy data, and cooking-progress UX candidates.
- [Archived Superpowers plans and specifications](./archive/superpowers/) - historical proposals and plans, not current implementation instructions.

## Archive

Historical implementation plans, design proposals, and task reports are kept in
[`docs/archive`](./archive/). Archived documents describe decisions made at
the time they were written; they are not current implementation instructions.

## Documentation rules

1. Write current documentation in English for developer review.
2. Link to paths and commands that exist in the checked-in repository.
3. Record verification commands and environment-only blockers explicitly.
4. Do not put credentials, tokens, private URLs, or production data in docs.
5. Move completed or superseded plans to the archive instead of presenting them as active work.
