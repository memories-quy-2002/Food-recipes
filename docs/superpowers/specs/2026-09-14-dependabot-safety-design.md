# Dependabot Safety Design

## Goal

Make dependency update PRs smaller and safer without introducing Merge Queue or automatic rollback behavior.

## Scope

1. Add a dependency downgrade/drift guard for frontend and backend direct dependencies.
2. Split Dependabot minor/patch groups into runtime and development groups.
3. Remove the invalid `dependabot` label reference from Dependabot configuration while preserving existing valid labels.

## Dependency downgrade/drift guard

A pull request that changes dependency manifests must fail when the candidate manifest lowers the comparable semantic version floor of an existing direct dependency relative to the PR base commit. The guard covers `dependencies`, `devDependencies`, `peerDependencies`, and `optionalDependencies` in `src/frontend/package.json` and `src/backend/package.json`.

The implementation must compare the checked-out PR manifests against the exact pull-request base SHA, not against a mutable remote branch name. Non-semver specifiers such as `workspace:`, `file:`, Git URLs, and other unsupported ranges are ignored rather than guessed. Dependency removal is not treated as a downgrade.

The guard runs in `Dependency Security` for dependency-manifest pull requests and remains read-only. It uses `actions/checkout` with full history so the base SHA is available to `git show`.

## Dependabot groups

For both frontend and backend npm ecosystems, minor and patch version updates are split into two groups:

- runtime: `dependency-type: production`
- dev: `dependency-type: development`

Major updates remain standalone. Backend `class-validator` remains excluded from the generic runtime group because it has previously required individual review.

## Labels

The repository currently does not expose a repository-level `dependabot` label that Dependabot can apply. Remove the invalid label reference and keep `dependencies` for npm updates. GitHub Actions updates continue using `dependencies` and `github-actions`.

## Non-goals

- Merge Queue
- Dependabot auto-merge
- intentional downgrade/rollback escape hatch
- write permissions in CI
- broad dependency-policy enforcement beyond direct manifest dependencies

## Verification

- Unit-style Node validation proves equal/upgraded versions pass and downgraded versions fail.
- Repository CI workflow validation confirms the guard is wired into static validation and dependency-security workflow.
- Full GitHub Quality Gates and Dependency Security checks must pass on the implementation PR before merge.
