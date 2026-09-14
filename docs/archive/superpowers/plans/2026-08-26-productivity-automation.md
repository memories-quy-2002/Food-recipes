# Productivity Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce repetitive local and CI work by providing one developer control center, changed-path verification, and package-aware CI gates.

**Architecture:** Keep `src/frontend` and `src/backend` as independent packages. Add small root-level PowerShell orchestration scripts that call the existing package scripts with the pinned pnpm version, discover changed paths through Git, and fail early on missing prerequisites. Add a CI filter job that skips unaffected package jobs while preserving the existing static validators and release protections.

**Tech Stack:** PowerShell, Git, Corepack pnpm 11.18.0, Docker Compose, GitHub Actions, Node 24.

## Global Constraints

- Preserve the current dirty frontend TypeScript migration; do not stage, restore, rename, or delete its files.
- Do not create a root pnpm workspace or move package-local dependencies.
- Run frontend commands from `src/frontend` and backend commands from `src/backend`.
- Use `corepack pnpm@11.18.0` for backend and automation package-manager commands.
- Do not print environment values or secrets.
- Do not automatically commit, push, merge, reset, or deploy.
- Keep production Prisma workflows manual and never use `prisma migrate reset`.

---

### Task 1: Add automation smoke tests

**Files:**
- Create: `tools/tests/automation.tests.ps1`

**Interfaces:**
- Consumes: `tools/dev.ps1` and `tools/verify.ps1` command-line interfaces.
- Produces: repeatable dry-run assertions for command selection and safe status behavior.

- [ ] **Step 1: Write the failing smoke tests**

Create a PowerShell smoke test that invokes the future scripts with `-DryRun`, checks that frontend and backend commands use the expected package directories, checks that `Changed` discovers the current worktree without mutating it, and checks that `dev status -DryRun` does not start a process.

- [ ] **Step 2: Run the smoke tests and verify they fail because the scripts do not exist**

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/tests/automation.tests.ps1
```

Expected: FAIL with missing `tools/verify.ps1` or `tools/dev.ps1`.

- [ ] **Step 3: Re-run after implementation and require all assertions to pass**

The test must exit 0 and print a concise pass message.

### Task 2: Implement the local developer control center

**Files:**
- Create: `tools/dev.ps1`
- Modify: `.gitignore`
- Create: `.gitattributes`

**Interfaces:**
- Consumes: `src/backend/.env`, `src/frontend/.env` when present, backend Compose file, and existing package scripts.
- Produces: `start`, `stop`, and `status` commands for direct local processes or Docker-backed API development.

- [ ] **Step 1: Implement `dev.ps1`**

Support:

```powershell
.\tools\dev.ps1 start                  # direct Nest API + Vite
.\tools\dev.ps1 start -Mode docker    # Compose API stack + Vite
.\tools\dev.ps1 status
.\tools\dev.ps1 stop
.\tools\dev.ps1 status -DryRun
```

The script must validate required executables and backend `.env` before starting, start backend/frontend in separate controllable PowerShell processes, persist only process metadata under `.dev/`, stop only recorded processes, support Compose `up -d`/`down`, poll `http://127.0.0.1:3000/api/docs-json` after startup, and never echo secret values.

- [ ] **Step 2: Ignore runtime process metadata**

Add `.dev/` to `.gitignore` without changing existing ignore rules.

- [ ] **Step 3: Normalize repository text files**

Add `.gitattributes` with LF for source/config/docs and CRLF for PowerShell scripts so Windows checkout noise does not obscure real changes.

- [ ] **Step 4: Run the dry-run smoke assertions**

Run the Task 1 command and verify no process is started and no `.dev` metadata is created.

### Task 3: Implement changed/full verification

**Files:**
- Create: `tools/verify.ps1`

**Interfaces:**
- Consumes: Git tracked and untracked path lists plus existing `package.json` scripts.
- Produces: `Changed`, `Full`, `Frontend`, `Backend`, and `E2E` verification scopes with `-DryRun`, `-SkipBuild`, and `-IncludeE2E` options.

- [ ] **Step 1: Implement changed-path classification**

Classify `src/frontend/**` as frontend work, `src/backend/**` as backend work, `.github/**` and root tooling changes as cross-package work, and documentation-only changes as no package work. Include both `git diff --name-only HEAD` and untracked files from `git ls-files --others --exclude-standard`.

- [ ] **Step 2: Implement command execution and timing**

Use the binaries installed by each package, matching the existing package scripts without invoking pnpm's automatic dependency reconciliation during verification:

```text
frontend: node_modules/.bin/eslint, tsc, vitest, vite
backend:  node_modules/.bin/prisma (validate/generate), tsc, jest
e2e:      node_modules/.bin/playwright
```

Print each command, elapsed time, and stop at the first non-zero exit code. `Changed` must run only affected packages; `Full` must run both; `-IncludeE2E` must add the browser journey after package checks.

- [ ] **Step 3: Run dry-run and focused real verification**

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/verify.ps1 -Scope Changed -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File tools/verify.ps1 -Scope Frontend -SkipBuild
```

Expected: dry-run prints selected commands without running them; the focused frontend check reports its actual exit status.

### Task 4: Make CI package-aware

**Files:**
- Modify: `.github/workflows/quality-gates.yml`
- Modify: `src/backend/test/ci-workflow.validation.mjs`

**Interfaces:**
- Consumes: GitHub pull request/push event paths.
- Produces: `changes` outputs and conditional `backend`/`frontend` jobs while keeping static validation always available.

- [ ] **Step 1: Add a `changes` job**

Use `dorny/paths-filter@v3` with filters for frontend, backend, and cross-cutting workflow/config changes. Cross-cutting changes must enable both package jobs. Manual dispatch must run both packages.

- [ ] **Step 2: Gate package jobs and preserve security checks**

Make backend and frontend depend on `changes`; keep their existing install, check, build, E2E, artifact, and Docker steps unchanged. The workflow must retain read-only permissions and must not push or mutate a database.

- [ ] **Step 3: Extend the repository validator**

Update the existing static validator to expect the `changes` job and assert the filters and `needs`/`if` conditions are present without weakening the existing quality and production-baseline assertions.

- [ ] **Step 4: Run the CI validator**

Run:

```powershell
node src/backend/test/ci-workflow.validation.mjs
```

Expected: the validator passes with the new conditional job structure.

### Task 5: Document the fast workflow

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: the new `tools/dev.ps1` and `tools/verify.ps1` commands.
- Produces: copy-ready local workflow documentation that preserves the split package boundary.

- [ ] **Step 1: Add the automation section**

Document start/stop/status, changed verification, full verification, E2E prerequisites, and the fact that root is not a pnpm workspace.

- [ ] **Step 2: Correct stale entrypoint wording**

Update the project tree entrypoint from `main.jsx` to the actual `main.tsx` without broad documentation rewrites.

- [ ] **Step 3: Run final verification**

Run the smoke test, CI validator, `git diff --check`, and inspect `git status --short` to confirm only intended automation/docs files were added or modified alongside the pre-existing migration changes.
