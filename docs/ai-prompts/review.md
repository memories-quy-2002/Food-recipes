# Review workflow

The default mode is read-only.

## Task input

- Mode: read-only | implement a specifically approved correction
- Review lens: behavior | UI | API | data | security | architecture
- Target: exact diff, files, route, or journey
- Expected behavior or review criteria:
- Known verification already run:

## Instructions

1. Follow the shared task contract in [README.md](./README.md). Read current
   guides and Wiki pages that govern the target.
2. Inspect the actual diff, current source, callers, configuration, and
   relevant tests. Do not infer behavior from a commit title or old plan.
3. Select the requested review lens. Use multiple lenses only when the user
   requests a broad review or the change crosses those boundaries.
4. Report actionable findings first. For each finding include severity,
   exact file and line, evidence, impact, and a concrete correction.
5. Separate confirmed defects from questions, optional improvements, and
   environment limitations. Do not report a concern without evidence as a bug.
6. In read-only mode, do not edit files. If correction work was explicitly
   approved, limit edits to that finding and preserve the rest of the diff.
7. State the coverage boundary and checks actually run. Do not claim a runtime,
   browser, database, or security behavior was verified without evidence.