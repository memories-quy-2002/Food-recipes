# Dependabot Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent stale dependency PR downgrades, split Dependabot runtime/dev update groups, and remove the invalid Dependabot label reference.

**Architecture:** A small Node ESM guard compares direct dependency versions in the checked-out PR against the exact PR base commit. GitHub Actions invokes that guard only for dependency-manifest pull requests, while Dependabot grouping is narrowed by `dependency-type` so runtime and development updates no longer share oversized PRs.

**Tech Stack:** GitHub Actions, Dependabot v2 config, Node.js 24 ESM, pnpm 11.18.0

**Spec:** `docs/superpowers/specs/2026-09-14-dependabot-safety-design.md`

## Global Constraints

- No Merge Queue.
- No auto-merge.
- No downgrade/rollback escape hatch.
- CI permissions remain read-only.
- Major dependency updates remain standalone.
- Backend `class-validator` remains individually reviewed.

---

### Task 1: Add downgrade guard tests and implementation

**Files:**
- Create: `.github/scripts/check-dependency-downgrades.mjs`
- Create: `src/backend/test/dependency-downgrade.validation.mjs`
- Modify: `.github/workflows/quality-gates.yml`

**Interfaces:**
- Consumes: `BASE_SHA` environment variable and repository package manifests.
- Produces: process exit code 0 when no downgrade is found; non-zero with a readable dependency list when a downgrade is found.

- [x] **Step 1: Add failing validation tests** covering upgrade, equal version, downgrade, dependency removal, and unsupported non-semver specifiers.
- [x] **Step 2: Run static validation and verify the new test fails because the guard module does not exist.**
- [x] **Step 3: Implement the minimal ESM guard**, comparing `dependencies`, `devDependencies`, `peerDependencies`, and `optionalDependencies` for frontend/backend manifests against `git show <BASE_SHA>:<path>`.
- [x] **Step 4: Run the dependency validation and full static validators; expect PASS.**
- [x] **Step 5: Add the new validators to the `static` Quality Gates job.**

### Task 2: Wire the guard into Dependency Security

**Files:**
- Modify: `.github/workflows/dependency-security.yml`
- Create: `src/backend/test/dependabot-safety.validation.mjs`

**Interfaces:**
- Consumes: `github.event.pull_request.base.sha`.
- Produces: `Dependency downgrade guard` job result on dependency-manifest PRs.

- [x] **Step 1: Add CI safety validation first** to require full-history checkout, Node 24, `BASE_SHA`, read-only permissions, and invocation of the guard.
- [x] **Step 2: Verify the validator fails against the current workflow.**
- [x] **Step 3: Add the read-only guard job to `dependency-security.yml`.**
- [x] **Step 4: Re-run workflow validation; expect PASS.**

### Task 3: Split Dependabot groups and fix labels

**Files:**
- Modify: `.github/dependabot.yml`
- Modify: `src/backend/test/dependabot-safety.validation.mjs`

**Interfaces:**
- Produces four minor/patch groups: `frontend-runtime`, `frontend-dev`, `backend-runtime`, `backend-dev`.

- [x] **Step 1: Extend repository validation** to assert runtime/dev grouping, minor+patch-only behavior, backend `class-validator` exclusion, and absence of the invalid `dependabot` label.
- [x] **Step 2: Verify the validation fails against current Dependabot config.**
- [x] **Step 3: Update Dependabot config** with `dependency-type: production|development` groups and remove only the invalid `dependabot` labels.
- [x] **Step 4: Re-run static validation; expect PASS.**

### Task 4: PR verification

**Files:**
- No production-file changes beyond Tasks 1–3.

- [x] **Step 1: Open a PR from `chore/dependabot-safety` to `master`.**
- [x] **Step 2: Verify changed-file scope and review the patch.**
- [x] **Step 3: Wait for GitHub `Quality Gates` and `Dependency Security` checks and inspect any failures.**
- [ ] **Step 4: Merge only when all required checks pass and review has no blocking findings.**
