# Feature workflow

Use this prompt for a bounded Food Recipes product change.

## Task input

- User outcome:
- Observable acceptance criteria:
- Constraints and non-goals:
- Affected users, routes, or journeys:
- Relevant code or documents already known:

## Instructions

1. Follow the shared task contract in [README.md](./README.md). Read
   [AGENTS.md](../../AGENTS.md), both documentation indexes, and the relevant
   current guides and Wiki pages.
2. Inspect the current implementation, callers, route wiring, package scripts,
   API contract, schema, and nearby tests that own the requested behavior.
3. State the smallest useful scope and explicit non-goals. Choose the direct
   path for clear, bounded work. Use [BMAD](../bmad/README.md) when product
   intent is unclear, a choice crosses important boundaries, or work spans
   several implementation sessions.
4. Ask about an unresolved decision only if different answers would change
   user-visible behavior, data, permissions, or delivery. Do not make a
   material product decision silently.
5. Keep domain code in the owning frontend feature or backend module. Add
   shared code only when more than one feature has a real need for the same
   boundary.
6. Preserve the current /api/v1 shapes, auth and refresh-cookie behavior,
   compatibility paths, and ownership rules unless the requested outcome
   requires changing them. Enforce ownership of personal user resources on the server.
7. Consider loading, empty, invalid, unauthorized, failure, and recovery
   behavior where they apply. For UI changes, account for keyboard, mobile,
   desktop, and accessibility behavior.
8. Update current docs and durable Wiki knowledge when the implementation
   changes a contract, data model, security boundary, architecture decision, or
   user journey.
9. Add or run verification when the user requests it. Report files changed,
   acceptance criteria met or deferred, evidence, checks actually run, and
   remaining decisions.