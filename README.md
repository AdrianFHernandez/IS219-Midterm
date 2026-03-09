# Rate My Professor Search Website (219_tools)

This project runs a website UI at `scripts/rmp_ui.html` that searches live Rate My Professor data through a local API server.

## What This Website Does

- Searches real professor data from Rate My Professor.
- Shows professor name, school, department, rating, difficulty, and would-take-again.
- Supports filters in the UI:
  - Sort by rating
  - High-rated only (4+)
  - School filter (next to `Search Results` header)
- Paginates results.
- Shows a papers section under each professor card (currently mock publication data).

## Project Files You Need

- UI: `scripts/rmp_ui.html`
- Local API server: `api-server.ts`
- RMP service logic: `src/services/RateMyProfessorService.ts`

## Architecture (Simple)

1. Browser opens `scripts/rmp_ui.html`.
2. UI calls local endpoint:
   - `GET http://localhost:3000/api/search-professors?name=<query>&max=150`
3. Local server forwards search to Rate My Professor GraphQL.
4. Server returns normalized JSON to UI.
5. UI renders and filters the results.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the API server:

```bash
npm run api-server
```

You should see:

- `RMP API Server running on http://localhost:3000`
- `Search endpoint: GET http://localhost:3000/api/search-professors?name=John`

3. Open the website UI:

- Open file: `scripts/rmp_ui.html` in your browser.
- Search for a professor name (example: `Matthew Adams`).

## API Endpoints

### Health

`GET /api/health`

Example:

```bash
curl http://localhost:3000/api/health
```

### Search Professors

`GET /api/search-professors?name=<text>&max=<number>`

- `name` is required.
- `max` is optional (bounded in server logic).

Example:

```bash
curl "http://localhost:3000/api/search-professors?name=Matthew%20Adams&max=150"
```

Response shape:

```json
{
  "success": true,
  "query": "Matthew Adams",
  "results": [
    {
      "id": "...",
      "name": "Matthew Adams",
      "school": "New Jersey Institute of Technology",
      "avgRating": 4.1,
      "numRatings": 20,
      "avgDifficulty": 3.2,
      "wouldTakeAgain": 80,
      "department": "Civil Engineering"
    }
  ],
  "count": 1
}
```

## Important Behavior Notes

- UI is configured for real API professor results only (no fake professor fallback).
- Some professors may not appear for every query due to upstream RMP ranking/indexing behavior.
- Search completeness has been improved via backend pagination.
- Papers under professor cards are still mock data (not live Scholar API).

## Troubleshooting

### `Local API server is unavailable`

Start server in project root:

```bash
npm run api-server
```

### Port 3000 already in use

Stop the process on port 3000, then restart `npm run api-server`.

### Search returns 0 results

- Try adding school keyword in query (example: `Matthew Adams NJIT`).
- Try shorter or alternate spelling.

### CORS error in browser

Do not call RMP directly from browser code. Use the local API server only.

## Sprint / QA Docs

Project planning and QA status are here:

- `docs/sprints/planning/SPRINT_QA_AUDIT.md`
- `docs/sprints/planning/SPRINT_PLAN_INDEX.md`
- `docs/sprints/planning/CLEAN_ARCHITECTURE_STANDARD.md`
- `docs/sprints/active/ACTIVE_SPRINT.md`
- `docs/sprints/complete/`
