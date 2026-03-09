# S00 (Legacy Baseline) - Developer Quick Reference: Rate My Professor Integration

> Status: Legacy baseline document retained for history. Superseded by sprint QA and planning docs in this folder.

## Legacy Notice
This reference reflects early implementation details and may not match the latest architecture and behavior.
Use current sprint docs for validated workflows and acceptance criteria.

## Quick Start

### Test the CLI
```bash
# Build the project
npm run build

# Test professor search
npm run dev -- professor-search "Albert Einstein"

# Get JSON output for programmatic use
npm run dev -- professor-search "Stephen Hawking" --format json
```

## File Structure Added

New files created for Rate My Professor integration:

```
src/
  ├─ services/
  │  └─ RateMyProfessorService.ts     ← Rate My Professor API client
  ├─ providers/
  │  └─ RateMyProfessorProvider.ts    ← Provider implementation
  └─ commands/
     └─ ProfessorSearchCommand.ts     ← Dedicated professor search command

docs/
  ├─ RATE_MY_PROFESSOR_GUIDE.md       ← User guide
  ├─ AI_CHAT_INTEGRATION.md           ← AI tool integration guide
  └─ DEVELOPER_REFERENCE.md           ← This file
```

## API Integration Points

### Rate My Professor Service
```typescript
// src/services/RateMyProfessorService.ts
- searchProfessor(name: string, school?: string)
- formatProfessorsForDisplay(professors: Professor[])
```

### Provider
```typescript
// src/providers/RateMyProfessorProvider.ts
- search(query: string) // Implements ISearchProvider
```

### Command
```typescript
// src/commands/ProfessorSearchCommand.ts
- execute(args: string[], opts?: any)
```

## How It Works

### Dedicated Professor Search
```
User enters: professor-search "john smith"
    ↓
ProfessorSearchCommand.execute()
    ↓
RateMyProfessorService.searchProfessor()
    ↓
RateMyProfessorProvider formats results
    ↓
Display formatted output
```

## Adding to AI Tools

To add as a tool in your AI chat application:

```typescript
// 1. Import the service
import { RateMyProfessorService } from './services/RateMyProfessorService';

// 2. Create instance
const rmpService = new RateMyProfessorService();

// 3. Define tool
const tool = {
  name: "search_professor",
  description: "Search for professor ratings and reviews",
  execute: async (args) => {
    const results = await rmpService.searchProfessor(args.name);
    return results;
  }
};
```

## Testing

### Manual Testing
```bash
# Test basic search
npm run dev -- professor-search "John Smith"

# Test JSON output
npm run dev -- professor-search "Alice Johnson" --format json
```

### Expected Output Format
```json
{
  "provider": "ratemyprofessor",
  "query": "John Smith",
  "results": [
    {
      "title": "John Smith",
      "snippet": "State University - Computer Science | Rating: 4.7/5 (89 reviews)",
      "url": "https://www.ratemyprofessors.com/professor/12345",
      "metadata": {
        "rating": 4.7,
        "difficulty": 3.5,
        "wouldTakeAgain": 91.2
      }
    }
  ]
}
```

## Environment Variables

No additional environment variables needed.

Rate My Professor API is public and doesn't require authentication.

## Key Classes

### RateMyProfessorService
- Handles GraphQL queries to RateMyProfessor.com
- Parses responses into typed `Professor[]`
- Provides display formatting

### RateMyProfessorProvider
- Returns results in standard format with metadata
- Integrates with search system

### ProfessorSearchCommand
- CLI command for dedicated professor search
- Formats output for display

## Common Tasks

### How to extend search capabilities
1. Create new service in `src/services/`
2. Create provider in `src/providers/`
3. Register in command registry
4. Add to CLI

### How to add more professor metadata
1. Update `Professor` interface in `RateMyProfessorService`
2. Update GraphQL query parsing
3. Update `formatProfessorsForDisplay()` method
4. Results automatically include in output

### How to change Rate My Professor API
Rate My Professor uses GraphQL. Update the query in `buildSearchQuery()` method of `RateMyProfessorService`.

## Troubleshooting

### Build fails
```bash
npm run build
# Should show any TypeScript errors
```

### Search returns no results
- Check professor name spelling
- Try adding school name
- Verify rate my professors website is accessible

### API errors
- Check network connection
- Rate My Professor API might be temporarily down
- Check browser access to ratemyprofessors.com

## Performance Notes

- First search: 2-3 seconds (includes network latency)
- Subsequent searches: Faster (with caching)
- JSON parsing: Negligible (typically <100ms)
- GraphQL query parsing: ~500ms average

## Future Enhancement Ideas

- [ ] Cache professor data per session
- [ ] Add school/department filtering
- [ ] Compare multiple professors
- [ ] Sort results by rating/difficulty
- [ ] Get full review text
- [ ] Course-specific ratings
- [ ] Batch search multiple professors
