# S02 - TDD Real Results UI And Filters

## Goal
Ensure UI shows only real API professors and provides clean filtering controls.

## Scope
- Remove fabricated professor fallback.
- School filter next to `Search Results` header.
- Keep sort and high-rating filters consistent.

## Red
1. Failing test: API failure must not inject fake professor rows.
2. Failing test: school dropdown must exist near results header.
3. Failing test: selecting school restricts visible cards to that school.

## Green
1. Return empty/no-results when API has none.
2. Populate school dropdown from result set.
3. Apply school/high-rating/sort in one filter pipeline.

## Refactor
1. Move filter-state derivation into pure helper.
2. Move header control rendering into dedicated function (if UI modularized).

## Acceptance Criteria
1. No fabricated professors shown.
2. School filter appears beside `Search Results` and works.
3. Result count matches filtered set.

## Traceability
Implemented and verified in current codebase.
