# Recipe URL import

The server reads a public recipe URL and builds a preview. The signed-in owner
can review the result before saving it as a private draft. The import path
validates the URL and parsed data, avoids automatic publication, and preserves
ownership checks.

## Sources

- [Import module](../../src/backend/src/modules/recipe-imports/)
- [Import feature](../../src/frontend/features/recipe-import/)
- [API contract](../../docs/backend/current-api-contract.md)
