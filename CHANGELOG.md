# Changelog

All notable changes to Food Recipes will be documented in this file.

The format follows the spirit of Keep a Changelog, and this project uses calendar dates for release entries.

## [Unreleased]

### Added

- React Helmet SEO metadata through a reusable `PageHelmet` component.
- Page-specific titles, descriptions, canonical URLs, Open Graph tags, and Twitter card metadata.
- Account page redesign with login/signup mode switching, password reveal controls, loading states, and signup password strength feedback.
- News and About pages.
- Additional recipe and rating seed data.
- Express request logging middleware.
- Centralized Express 404 and error handling middleware.
- PostgreSQL query logging instrumentation with `DB_QUERY_LOGGING=false` support.

### Changed

- Improved Home, Header, Footer, Food, Profile, Wishlist, Recipes, Add Recipe, Login, and Signup UI.
- Local development API calls now default to `http://localhost:4000`.
- Server CORS handling now supports localhost development origins and production frontend origins.
- Serverless PostgreSQL pool setup now reuses a global pool and uses safer idle/pool defaults.
- Recipe review submission now refreshes review state without forcing a full page reload.

### Fixed

- Prevented review UI crashes when a user has not rated a recipe yet.
- Prevented duplicate `(user_id, recipe_id)` rating seed keys.
- Fixed Home hero layout and search alignment issues.
- Fixed Vercel `/api/...` route normalization for server routes.
- Removed an undefined `reportWebVitals()` runtime call.
