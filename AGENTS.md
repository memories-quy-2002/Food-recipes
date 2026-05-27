# AGENTS.md

## Project Overview

Food Recipes is a full-stack recipe discovery and food management application.

The project appears to focus on recipe browsing, food content presentation, search/filter flows, and user-oriented cooking interactions.

Before implementing changes:

1. Inspect the repository structure first.
2. Read the root `README.md`.
3. Identify the package manager and workspace structure.
4. Inspect only the files directly related to the requested task.

Avoid scanning the entire repository unless explicitly required.

## Development Philosophy

Prefer:

- Small, reviewable changes.
- Minimal diffs.
- Strong typing.
- Readable and maintainable code.
- Reusing existing abstractions and utilities.

Avoid:

- Broad refactors without request.
- Reformatting unrelated files.
- Introducing unnecessary dependencies.
- Rewriting working code without measurable benefit.

## Frontend Guidelines

When working on frontend features:

- Keep components focused and composable.
- Separate UI rendering from business logic.
- Reuse existing hooks, contexts, services, and shared utilities.
- Keep state as local as possible.
- Prefer derived state over duplicated state.
- Avoid deeply nested component trees when unnecessary.

For React components:

- Prefer functional components.
- Prefer explicit props typing.
- Keep effects predictable and dependency-safe.
- Avoid unnecessary re-renders.
- Memoize only when there is measurable value.

For styling:

- Follow the existing styling architecture.
- Reuse existing spacing, typography, layout, and color conventions.
- Avoid inline styles unless already used consistently in the codebase.
- Keep responsive behavior in mind for mobile/tablet/desktop.

## Backend Guidelines

If backend/API code exists:

- Follow the existing route/controller/service/model architecture.
- Keep controllers thin.
- Keep business rules in services.
- Keep persistence and query logic in models/repositories.
- Avoid direct DB access from controllers.

Validation rules:

- Validate all external input.
- Never trust client-provided IDs or ownership.
- Return clear status codes and actionable errors.

Performance rules:

- Avoid N+1 queries.
- Avoid loading unnecessary fields/data.
- Prefer pagination for large datasets.
- Avoid repeated expensive computations.

## API Guidelines

Before modifying APIs:

1. Inspect route definitions first.
2. Preserve existing response shapes when possible.
3. Avoid breaking frontend consumers.
4. Keep backward compatibility unless explicitly requested otherwise.

When adding endpoints:

- Use clear naming conventions.
- Keep payloads predictable.
- Return minimal required data.
- Add validation and error handling.

## Recipe Domain Guidelines

Recipe-related features should preserve consistency across:

- Ingredients
- Measurements
- Categories
- Cooking instructions
- Nutrition data
- Images/media
- Search/filter logic
- Favorites/bookmarks
- Ratings/reviews
- User-generated content

When implementing recipe logic:

- Keep normalization consistent.
- Avoid duplicating recipe transformation logic.
- Prefer reusable formatting/parsing helpers.

## Search and Filtering

For recipe search/filter functionality:

- Prefer server-side filtering when datasets become large.
- Debounce expensive search requests.
- Keep filter state serializable when possible.
- Preserve URL/query parameter synchronization if already implemented.

## Authentication and Security

If auth exists:

- Preserve token/session flows.
- Do not weaken authorization checks.
- Do not bypass validation for convenience.
- Avoid leaking sensitive user information.

Never commit:

- `.env`
- API keys
- Tokens
- Secrets
- Production credentials

## File and Folder Conventions

Before creating new files:

- Check if an existing folder pattern already exists.
- Follow the repository naming conventions.
- Prefer colocating related logic.

Avoid:

- Generic utility dumping grounds.
- Massive shared helper files.
- Circular dependencies.

## Testing Guidelines

When changing functionality:

- Test only the affected scope first.
- Prefer targeted verification over running unrelated suites.
- Keep test coverage focused on behavior changes.

Before finishing:

1. Run the relevant typecheck/build/test commands.
2. Verify no unrelated files changed.
3. Summarize changed files and assumptions.

## Performance Guidelines

Prefer:

- Lazy loading for heavy UI sections.
- Memoized expensive computations.
- Efficient list rendering.
- Stable keys in mapped lists.
- Image optimization when applicable.

Avoid:

- Over-fetching.
- Large unnecessary payloads.
- Excessive global state.
- Deep prop drilling when existing shared state already solves it.

## Accessibility Guidelines

Maintain accessibility where applicable:

- Semantic HTML.
- Proper button/input usage.
- Keyboard accessibility.
- Meaningful alt text.
- Correct heading hierarchy.

## Code Style

General rules:

- Prefer TypeScript when available.
- Keep functions small and explicit.
- Prefer early returns over deep nesting.
- Avoid magic values.
- Keep naming descriptive and consistent.
- Avoid over-engineering abstractions.

Comments:

- Explain "why", not obvious "what".
- Remove stale comments.
- Avoid noisy comments.

## Git and PR Guidelines

Prefer:

- Small commits.
- Conventional Commit style messages.
- Clear PR summaries.

Include:

- What changed.
- Why it changed.
- Verification steps.
- Known limitations or follow-up tasks.

## Codex Workflow

When working on this repository:

1. Read `AGENTS.md`.
2. Inspect only the minimal relevant files.
3. Create a concise implementation plan for broad tasks.
4. Make minimal scoped edits.
5. Run relevant verification commands.
6. Summarize:
   - changed files
   - behavioral impact
   - verification steps
   - assumptions/risks

For token efficiency:

- Do not scan the entire repository by default.
- Use targeted file inspection.
- Start from route/component entrypoints.
- Prefer symbol search over opening many files.
- Avoid reading generated files, build outputs, and lockfile internals unless necessary.
