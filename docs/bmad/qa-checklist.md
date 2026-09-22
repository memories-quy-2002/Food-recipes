# Food Recipes QA checklist

Select only the checks relevant to the approved scope. Record evidence for
checks that were run. Mark other checks not applicable or not run; a checklist
item is not evidence by itself.

## Product behavior

- [ ] Acceptance criteria describe observable behavior.
- [ ] Guest and authenticated behavior are correct where relevant.
- [ ] Loading, empty, validation, permission, failure, and recovery states are
  clear where relevant.
- [ ] The change preserves the approved scope and non-goals.

## Frontend

- [ ] Relevant desktop and mobile routes render without clipping or overflow.
- [ ] Keyboard navigation, focus, accessible names, and status announcements
  work for changed controls.
- [ ] Existing feature, shared UI, API, and styling patterns are followed.
- [ ] Private server data and secrets are not exposed to browser code.

## API, backend, and data

- [ ] Input validation and error behavior match the current API contract.
- [ ] Authentication and personal ownership checks run server-side.
- [ ] API response shape and compatibility paths are intentional.
- [ ] Migration safety, existing data, duplicates, retries, and concurrency are
  considered where relevant.
- [ ] External-service failures and recovery are handled where relevant.

## Verification and operations

- [ ] Requested checks were run from the correct independent package.
- [ ] Unit, mocked browser, real API, disposable database, staging, and
  production evidence are identified separately.
- [ ] Relevant maintained docs and durable Wiki pages are updated.
- [ ] Production changes follow the operator-controlled runbooks and exact
  authorization.

## Evidence record

- Change and acceptance criteria:
- Commands or journeys run and results:
- Checks not run or blocked, and why:
- Remaining risk or follow-up: