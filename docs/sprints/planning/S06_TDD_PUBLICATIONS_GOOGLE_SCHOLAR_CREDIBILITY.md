# S06 - TDD Publications Google Scholar Credibility

## Goal
Deliver publication data under each professor card using Google Scholar as the current source, with credibility guarantees.

## Scope
- Replace mock publication rows with real Google Scholar-backed data.
- Require verifiable evidence per publication row.
- Keep extension path for additional sources later.

## Red
1. Failing test: publications endpoint returns mock rows without source evidence.
2. Failing test: publication card renders without Scholar link/citation evidence.
3. Failing test: unverifiable publication row appears in UI.
4. Failing test: source label missing (`Google Scholar`).

## Green
1. Add `GoogleScholarPublicationsGateway` adapter.
2. Add `GetProfessorPublicationsUseCase` with verification policy:
   - allow only rows with Scholar URL or citation count.
3. Add API endpoint contract for publications per professor.
4. Update UI publications section to consume verified rows only.
5. Label source on UI: `Source: Google Scholar`.

## Refactor
1. Extract publication DTO mapper and credibility validator.
2. Separate query construction, transport, and parsing in Scholar adapter.
3. Add cache boundary interface to reduce duplicate Scholar requests.

## Test Matrix
1. Professor with verified Scholar publications -> rows render with links/evidence.
2. Professor with no verifiable Scholar results -> `No verified publications found`.
3. Scholar transport failure -> graceful empty state + non-blocking UI.
4. Publication source label always visible and correct.

## Acceptance Criteria
1. Publications shown are real and source-verifiable.
2. Every row includes either Scholar link or citation evidence.
3. Mock publication fallback is disabled for production mode.
4. Future source adapters can be added without changing core use-case contract.

## Out Of Scope (This Sprint)
- Multi-source publication ranking/merging.
- Full bibliographic normalization across all source formats.
