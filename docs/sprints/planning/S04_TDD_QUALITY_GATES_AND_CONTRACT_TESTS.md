# S04 - TDD Quality Gates And Contract Tests

## Goal
Remove regression risk by enforcing automated test gates for service, API, and UI contracts.

## Scope
- Service unit tests.
- API contract tests.
- UI behavior tests for filters and empty/error states.
- Publication verification tests (Google Scholar link/citation presence).

## Red
1. Failing tests for API contract shape drift.
2. Failing tests for filter behavior consistency.
3. Failing tests for error messaging when local API is unavailable.
4. Failing tests when publication rows have no Scholar link and no citation evidence.

## Green
1. Add route contract tests.
2. Add service parser/pagination tests using fixtures.
3. Add UI tests for school filter placement and effect.
4. Add publication contract tests enforcing source=`Google Scholar` and evidence fields.

## Refactor
1. Introduce shared test fixtures for professor data.
2. Minimize duplication between API and UI test setup.

## Acceptance Criteria
1. CI/local test suite catches shape changes and filter regressions.
2. No manual-only verification dependency for critical flows.
3. Documentation references current test commands and pass criteria.
4. Publication cards fail QA if they are not source-verifiable.

## Gap Closed
Closes undefined QA gap: "no automated contract safety net".
