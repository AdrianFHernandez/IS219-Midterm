# S03 - TDD Search Completeness And Recall

## Goal
Increase practical search completeness while documenting upstream limits.

## Scope
- Cursor pagination from RMP teachers connection.
- Configurable result cap and de-dup.
- Preserve unrated but real professors.

## Red
1. Failing test: single page misses known match in deeper pages.
2. Failing test: duplicate IDs can appear across pages.
3. Failing test: unrated real professor is incorrectly removed.

## Green
1. Implement paged fetch with `first: 50` + `after` cursor.
2. Add `max` cap and duplicate ID filter.
3. Keep `avgRating = 0` entries as valid results.

## Refactor
1. Isolate paging loop from parsing logic.
2. Extract dedup utility by professor id.

## Acceptance Criteria
1. Multi-page queries return broader result sets.
2. Known downstream checks (e.g., NJIT Matthew Adams) become discoverable.
3. No forced rating threshold removes valid results.

## Traceability
Implemented and verified in current codebase.
