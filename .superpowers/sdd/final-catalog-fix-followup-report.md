# Final catalog aggregation safety follow-up report

## Scope

- `src/client/features/recipes/api/useRecipeQueries.ts`
- `src/client/features/recipes/api/useRecipeQueries.test.ts`
- `.superpowers/sdd/final-catalog-fix-followup-report.md`

## Changes

- Reject malformed initial pagination instead of treating it as a legacy response.
- Keep legacy fallback only for an initial array or non-paginated `{ recipes }` envelope.
- Reject requested subsequent pages that omit pagination, contain malformed metadata, do not advance to the requested page, or disagree with prior catalog metadata.
- Reject a valid catalog when `hasNext` remains true at the 1,000-page aggregation cap.
- Preserve sequential aggregation, stable query keys/detail behavior, and the existing `AbortSignal` on every request.

## Verification

- `corepack pnpm vitest run src/client/features/recipes/api/useRecipeQueries.test.ts` — exit code `0`; 1 test file passed, 12 tests passed.
- `corepack pnpm typecheck` — exit code `0`; `tsc -p tsconfig.json --noEmit` completed successfully.
- Live browser/API validation was not run.

## Limitations

- A catalog that requires more than 1,000 pages at the fixed page size is rejected rather than partially returned.
- This report does not establish live backend or browser behavior.
