# Smart Weekly Shopping List — Design

## Intent
Replace direct recipe-ID import with a read-only weekly shopping preview. Aggregate requirements across planned meals and servings; subtract pantry once; ask for confirmation. Support personal and household scopes with existing authorization.

## Alternatives
- Selected: existing NestJS planning repository plus a pure aggregation helper and typed preview/confirm API. No infrastructure or migration.
- Rejected: browser-only aggregation, asynchronous workers, and blind recipe-ID import.

## Rules
- Use each planned meal (not unique recipe IDs), skip completed cooking and leftovers.
- Combine normalized names and compatible measurement units. Deduct pantry availability once per ingredient group.
- Ambiguous text-only ingredients are review-only, never guessed or auto-added.
- Preview is read-only. Confirm recalculates and rejects stale fingerprints; never modify manual or checked shopping items.
- Household viewers may preview but never confirm.
- UI includes Preview → Confirm / Cancel with loading, error and empty states.

## Limits
Do not infer food densities, synonyms, or unknown quantities. Repeated confirmation respects shopping-list duplicate protection. Full transaction-level consistency across pantry edits is follow-up hardening rather than claimed here.
