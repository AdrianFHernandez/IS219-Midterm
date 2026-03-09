# S01 - TDD API Contract Stabilization

## Goal
Stabilize the backend contract from local API to RMP GraphQL with no schema ambiguity.

## Scope
- GraphQL query compatibility (`newSearch`).
- API response shape consistency.
- Error normalization.

## Red
1. Failing test: service rejects deprecated query field usage.
2. Failing test: route must return `results: []` and `count` integer.
3. Failing test: missing `name` returns `400`.

## Green
1. Implement schema-compatible query payload.
2. Normalize route output contract.
3. Add bounded `max` handling (`10..300`).

## Refactor
1. Extract payload builder from transport call.
2. Add typed DTO for route response.

## Acceptance Criteria
1. No `search`/`Professor` schema errors in server logs.
2. Route always returns `{ success, query, results, count }`.
3. Validation failures are deterministic and user-readable.

## Traceability
Implemented and verified in current codebase.
