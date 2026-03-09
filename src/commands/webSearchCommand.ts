import type { Command as CommanderProgram } from 'commander';
import type { Command } from '../core/command';
import { writeReferenceFile } from '../core/output';
import type { OpenAIWebSearchService } from '../services/openaiWebSearchService';
import { RmpService } from '../services/RmpService';

export class WebSearchCommand implements Command {
  name = 'web-search';
  description = 'Search the web with the OpenAI web search tool';

  constructor(private readonly service: OpenAIWebSearchService) {}

  register(program: CommanderProgram): void {
    program
      .command(this.name)
      .description(this.description)
      .argument('<query>', 'Search query')
      .option('-m, --model <model>', 'OpenAI model', 'gpt-4o-mini')
      .option('--rmp', 'Also search RateMyProfessors and include results')
      .action(async (query: string, options: { model: string }) => {
        try {
          let output = 'No output.';
          let content = `# Web Search\n\n**Query:** ${query}\n\n`;

          // If RMP requested, fetch those first so we can save them even if OpenAI fails
          if ((options as any).rmp) {
            try {
              const rmp = new RmpService();
              const r = await rmp.search(query, 5);
              if (r.length > 0) {
                content += '\n\n## RateMyProfessors Results\n';
                for (const item of r) {
                  content += `- ${item.name} - ${item.url}\n`;
                }
              } else {
                content += '\n\nNo RateMyProfessors results found.\n';
              }
            } catch (err) {
              content += `\n\nRMP fetch error: ${err instanceof Error ? err.message : String(err)}\n`;
            }
          }

          try {
            const result = await this.service.search(query, options.model);
            const text = result.text.trim();
            if (text.length > 0) {
              output = text;
              content += `\n\n## OpenAI Search Output\n\n${text}\n`;
            }
          } catch (err) {
            // don't fail if OpenAI search fails; proceed with any RMP content
            content += `\n\nOpenAI search error: ${err instanceof Error ? err.message : String(err)}\n`;
          }

          const filePath = await writeReferenceFile(query, content);

          process.stdout.write(`${output}\n`);
          process.stdout.write(`Saved to: ${filePath}\n`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          process.stderr.write(`${message}\n`);
          process.exitCode = 1;
        }
      });
  }
}
