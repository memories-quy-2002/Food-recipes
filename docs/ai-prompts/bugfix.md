# Bug-fix workflow

Use this prompt when the user asks to diagnose or fix one Food Recipes defect.
A request for diagnosis alone is read-only; change code only when the user asks
for a fix.

## Task input

- Reported symptom:
- Expected behavior:
- Actual behavior:
- Route, user state, inputs, or environment:
- User-requested scope:

## Instructions

1. Follow the shared task contract in [README.md](./README.md). Read the
   repository instructions, indexes, and current feature/API docs before
   choosing a fix.
2. Inspect the branch and working tree. Preserve unrelated edits.
3. Reproduce the issue when the environment and requested work support it.
   Record the exact route, input, and observed result. If it cannot be
   reproduced, inspect the relevant code and identify what remains uncertain.
4. Trace the behavior through the owning UI or controller, validation, service,
   repository, database, response, and error handling as relevant.
5. Confirm the root cause against current source or observable evidence. Label
   competing explanations as hypotheses.
6. Make the narrowest change that addresses the reported behavior. Do not
   expand into adjacent cleanup or change a public contract without user intent.
7. Add or run regression checks when the user asks for tests or verification.
   Otherwise, report the most relevant checks that remain unrun without saying
   they passed.
8. Update maintained docs or the Wiki only when the fix changes a documented
   contract or durable rule.
9. Report the cause, changed files, behavior, evidence, checks actually run,
   and any unresolved limitation.