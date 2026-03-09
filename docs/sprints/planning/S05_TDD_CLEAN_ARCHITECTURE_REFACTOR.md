# S05 - TDD Clean Architecture Refactor

## Goal
Apply Uncle Bob Clean Architecture boundaries so domain logic is framework-independent and test-first.

## Scope
- Introduce use cases + ports.
- Move parsing and business rules out of route/UI layers.
- Keep adapters thin.
- Introduce publication credibility use case with source-policy enforcement.

## Red
1. Failing test: use case should run without Express/fetch.
2. Failing test: school filtering should be pure and deterministic.
3. Failing test: presenter mapping should preserve contract fields.
4. Failing test: publication presenter must reject unverifiable rows.

## Green
1. Add `SearchProfessorsUseCase` and gateway interface.
2. Add `FilterProfessorsBySchoolUseCase` pure function/use case.
3. Move route to controller + presenter mapping.
4. Add `GetProfessorPublicationsUseCase` with Scholar verification policy.

## Refactor
1. Remove framework leakage from business logic.
2. Enforce inward dependency rule with module boundaries.

## Acceptance Criteria
1. Domain/use-case tests run without network.
2. Express and UI depend on adapters, not core business rules.
3. Architecture doc and code structure align 1:1.
4. Publications can switch source adapters later without changing core use-case contract.

## Gap Closed
Closes undefined architecture gap: "implementation works but lacks enforced clean boundaries".
