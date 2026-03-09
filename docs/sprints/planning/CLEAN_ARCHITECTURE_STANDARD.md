# Clean Architecture Standard (Uncle Bob)

## Objective
Adopt Uncle Bob style Clean Architecture so business rules are stable, framework details are isolated, and code remains testable.

## Dependency Rule
Source dependencies must point inward only.
- Outer layers may depend on inner layers.
- Inner layers never depend on UI, Express, fetch transport, or framework code.

## Target Layering For This Codebase
1. Entities (Core domain)
- `Professor`, `SearchQuery`, `SearchResult`, `Paper` domain models.
- No framework imports.

2. Use Cases (Application)
- `SearchProfessorsUseCase`
- `FilterProfessorsBySchoolUseCase`
- `GetProfessorPapersUseCase`
- Accept interfaces/ports, return pure data.

3. Interface Adapters
- Presenters/mappers for CLI output and UI JSON shape.
- Controller logic for parsing request/query params.

4. Frameworks/Drivers
- Express route handlers.
- Fetch-based RMP gateway.
- HTML/JS UI rendering code.

## Ports And Adapters
Define interfaces in inner layers:
- `ProfessorSearchGateway`: `searchByText(text, options)`
- `PapersGateway`: `getPapersForProfessor(name, school?)`
- `ProfessorRepository` (optional cache/store)

Implement adapters in outer layers:
- `RmpGraphqlGateway` (real API)
- `MockPapersGateway` (temporary until real source)

## Clean Code Rules
1. Single responsibility per function/module.
2. No hidden side effects; explicit returns.
3. Avoid boolean flag arguments; prefer specific methods.
4. Small functions with intention-revealing names.
5. Replace ad-hoc object shapes with typed DTOs.
6. One error policy per layer (normalize at boundaries).
7. Keep UI filtering pure and deterministic.

## Testing Strategy (TDD)
1. Unit tests for use cases and mappers first.
2. Integration tests for adapters (RMP gateway + API route).
3. Contract tests for API response shape.
4. UI behavior tests for filter/search state transitions.

## Definition Of Clean
1. Swapping Express route or UI framework does not alter use case tests.
2. Swapping RMP transport implementation does not alter use case tests.
3. Business rules pass without network access.
