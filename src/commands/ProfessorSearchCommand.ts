import type { Command as CommanderProgram } from 'commander';
import type { Command } from '../core/command';
import { RateMyProfessorService } from '../services/RateMyProfessorService';
import { RateMyProfessorProvider } from '../providers/RateMyProfessorProvider';
import { writeReferenceFile } from '../core/output';

export class ProfessorSearchCommand implements Command {
  name = 'professor-search';
  description = 'Search for professor information on Rate My Professor';

  private rmpService: RateMyProfessorService;

  constructor() {
    this.rmpService = new RateMyProfessorService();
  }

  register(program: CommanderProgram): void {
    program
      .command(this.name)
      .description(this.description)
      .argument('<query>', 'Professor name to search')
      .action(async (query: string) => {
        try {
          console.log(`\n🔍 Searching for professor: ${query}\n`);

          // Get Rate My Professor results
          const rmpProvider = new RateMyProfessorProvider(this.rmpService);
          const rmpResults = await rmpProvider.search(query);

          // Display RMP results
          let content = `# Professor Search\n\n**Query:** ${query}\n\n`;

          if (rmpResults.results && rmpResults.results.length > 0) {
            console.log('\n📚 Rate My Professor Results:');
            console.log('='.repeat(70));
            content += '## Rate My Professor Results\n\n';
            
            rmpResults.results.slice(0, 5).forEach((result: any, index: number) => {
              console.log(`\n${index + 1}. ${result.title}`);
              console.log(`   ${result.snippet}`);
              console.log(`   📖 URL: ${result.url}`);
              
              if (result.metadata) {
                console.log(`   💪 Rating: ${result.metadata.rating}/5 | Difficulty: ${result.metadata.difficulty}/5 | Would Take Again: ${result.metadata.wouldTakeAgain}%`);
              }

              content += `\n### ${index + 1}. ${result.title}\n`;
              content += `- **Info:** ${result.snippet}\n`;
              content += `- **URL:** ${result.url}\n`;
              if (result.metadata) {
                content += `- **Rating:** ${result.metadata.rating}/5.0 | Difficulty: ${result.metadata.difficulty}/5.0 | Would Take: ${result.metadata.wouldTakeAgain}%\n`;
              }
            });
            console.log('\n' + '='.repeat(70));
          } else {
            console.log('⚠️  No professors found on Rate My Professor');
            content += 'No professors found on Rate My Professor.\n';
          }

          const filePath = await writeReferenceFile(query, content);
          process.stdout.write(`Saved to: ${filePath}\n`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error('Search failed:', message);
          process.exit(1);
        }
      });
  }
}
