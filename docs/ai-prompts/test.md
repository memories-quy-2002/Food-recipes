# Test and QA workflow

Use this prompt when the user asks to add tests, run checks, or verify a
specific Food Recipes behavior.

## Task input

- Behavior to verify:
- Relevant user journey or rule:
- Requested verification level:
- Available environment and dependencies:
- Excluded checks or scope:

## Instructions

1. Follow the shared task contract in [README.md](./README.md). Inspect
   package-local scripts, existing test patterns, fixtures, and current
   documentation before selecting a command.
2. Define observable outcomes and identify the boundary under test. Reuse
   deterministic fixtures and the package's existing service isolation.
3. Choose focused unit, component, API, database, or browser verification that
   matches the request. A mocked browser journey is not evidence of live API or
   database behavior.
4. Cover relevant success and failure paths, including empty, invalid,
   unauthorized, duplicate, retry, or recovery cases when those are part of
   the behavior.
5. For UI behavior, inspect applicable keyboard, responsive, loading, empty,
   and error states. Use the existing Playwright setup for requested browser
   journeys.
6. Run only the requested checks from the package directory specified by
   [AGENTS.md](../../AGENTS.md). Do not widen a focused request into every
   suite without a reason.
7. Report each exact command and its result. Separate a product failure from a
   missing browser, service, database, credential, or local runtime. List
   checks not run.