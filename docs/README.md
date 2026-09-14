# Food Recipes documentation

This directory contains the current developer documentation for the Food Recipes platform.

## Current documentation

- [Production-quality audit](./audits/2026-09-14-production-quality-audit.md) - tracked-file scope, evidence, cleanup decisions, and verification boundaries.
- [Production roadmap](./roadmap.md) - the active P0/P1 delivery plan and acceptance criteria.
- [Current API contract](./backend/current-api-contract.md) - versioned NestJS routes, authentication rules, and data compatibility constraints.
- [Frontend API cutover matrix](./frontend/api-cutover-matrix.md) - frontend consumers mapped to the current API.
- [Current user journeys](./frontend/current-user-journeys.md) - observable product flows and browser verification coverage.
- [Legacy compatibility retirement](./backend/legacy-compatibility-retirement.md) - evidence-led deprecation rules for compatibility paths.
- [Production demo reset](./production-demo-reset.md) - manual, approval-gated operational runbook.

## Archive

Historical implementation plans, design proposals, and task reports are kept in
[`docs/archive`](./archive/). Archived documents describe decisions made at the
time they were written; they are not current implementation instructions.

## Documentation rules

1. Write current documentation in English for developer review.
2. Link to paths and commands that exist in the checked-in repository.
3. Record verification commands and environment-only blockers explicitly.
4. Do not put credentials, tokens, private URLs, or production data in docs.
5. Move completed or superseded plans to the archive instead of presenting them as active work.
