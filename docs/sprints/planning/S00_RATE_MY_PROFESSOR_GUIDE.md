# S00 (Legacy Baseline) - Rate My Professor Integration Guide

> Status: Legacy baseline document retained for history. Superseded by sprint QA and planning docs in this folder.

## Legacy Notice
This file contains early examples and assumptions from initial integration work.
Use the current sprint plan and QA docs for source-of-truth requirements and implementation status.

## Overview

The 219 Tools CLI now includes integrated Rate My Professor support! This allows you to search for professor information directly and get comprehensive ratings and reviews.

## Features

✅ **Dedicated Professor Search Command** - Use `professor-search` to get comprehensive professor information
✅ **Detailed Ratings** - Get overall rating, difficulty level, and "would take again" percentage
✅ **Real-time Data** - Uses Rate My Professor GraphQL API for current information
✅ **JSON Output** - All results can be exported as JSON for programmatic use

## Commands

### professor-search (Dedicated Professor Search)

Search specifically for professor information across Rate My Professor.

```bash
# Basic search
npm run dev -- professor-search "John Smith"

# JSON output
npm run dev -- professor-search "John Smith" --format json
```

**Output includes:**
- Professor name
- School and department
- Overall rating (out of 5)
- Number of ratings
- Difficulty level (out of 5)
- Would take again percentage

## Example Usage

### Example 1: Search for a Specific Professor

```bash
npm run dev -- professor-search "Dr. Sarah Johnson Computer Science"
```

**Output:**
```
🔍 Searching for professor: Dr. Sarah Johnson Computer Science

📚 Rate My Professor Results:
======================================================================

1. Sarah Johnson
   School: State University
   Department: Computer Science
   Overall Rating: ⭐ 4.50/5.0 (127 reviews)
   Difficulty: 3.80/5.0
   Would Take Again: 89.8%

2. Sarah Johnson
   School: Tech College
   Department: Information Technology
   Overall Rating: ⭐ 4.20/5.0 (45 reviews)
   Difficulty: 3.20/5.0
   Would Take Again: 92.5%

======================================================================
```

## API Integration Details

### RateMyProfessor Service

The `RateMyProfessorService` class handles all Rate My Professor API interactions:

```typescript
import { RateMyProfessorService } from './services/RateMyProfessorService';

const rmpService = new RateMyProfessorService();
const results = await rmpService.searchProfessor('John Smith');
```

**Search Parameters:**
- `name` (required): Professor name to search
- `school` (optional): School name to narrow results

**Response:**
```typescript
{
  professors: [
    {
      id: string,
      name: string,
      school: string,
      avgRating: number,      // 0-5
      numRatings: number,
      avgDifficulty: number,  // 0-5
      wouldTakeAgain: number, // 0-100
      department: string
    }
  ],
  school?: string
}
```

### RateMyProfessor Provider

The provider integrates with the search system:

```typescript
import { RateMyProfessorProvider } from './providers/RateMyProfessorProvider';
import { RateMyProfessorService } from './services/RateMyProfessorService';

const service = new RateMyProfessorService();
const provider = new RateMyProfessorProvider(service);
const results = await provider.search('John Smith');
```

## Integration with Chat/AI Tools

For AI chat integration, you can use this command as a tool:

```javascript
// Example: OpenAI Function Calling
{
  "name": "professor_search",
  "description": "Search for professor information and ratings from Rate My Professor",
  "parameters": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "Professor name to search"
      }
    },
    "required": ["name"]
  }
}
```

## Command Reference

| Command | Purpose |
|---------|---------|
| `professor-search` | Dedicated professor search |

## Options Reference

```bash
--format <fmt>         # Output format: pretty, json, plain
```

## Troubleshooting

### No Results Found

If no professors are found:
- Try using a more common name
- Include the university/school name
- Use the full name instead of abbreviations

### API Rate Limiting

Rate My Professor API may rate limit requests. The service handles this gracefully and will return an empty result set.

## Future Enhancements

- [ ] Filter by university/school
- [ ] Sort by rating, difficulty, or recency
- [ ] Get full professor reviews
- [ ] Course-specific ratings
- [ ] Professor comparison tool

## Notes

- Rate My Professor data is fetched in real-time via their GraphQL API
- Results are cached per session to optimize performance
- All data is displayed with proper formatting for readability
