import type { Command as CommanderProgram } from 'commander';
import { DuckDuckGoSearchProvider } from '../services/DuckDuckGoSearchProvider';
import { ResearchLibrary } from '../services/ResearchLibrary';
import { RmpService } from '../services/RmpService';

type CliContext = { args: string[]; options?: any; output: any };
type CommandResult = { success: boolean; message?: string; data?: any };
type HelpSection = { title: string; description: string; examples?: string[]; relatedTopics?: string[] };

export class WebResearchCommand {
  name = 'web-research';
  description = 'Search the web for a query, fetch top results and save a research record';
  aliases = ['research', 'websearch', 'search'];

  private provider = new DuckDuckGoSearchProvider();
  private library = new ResearchLibrary();

  async execute(context: CliContext): Promise<CommandResult> {
    const query = context.args.join(' ').trim();
    const limit = Number(context.options.limit ?? 5);
    if (!query) {
      return { success: false, message: 'Please provide a search query' };
    }

    context.output.log(`Searching web for: ${query}`, 'info');
    const spinner = context.output.spinner('Searching...');
    let results;
    try {
      results = await this.provider.search(query, limit);
      // optionally fetch RateMyProfessors results and prepend them
      if (context.options && (context.options as any).rmp) {
        try {
          const rmp = new RmpService();
          const r = await rmp.search(query, limit);
          // map RMP into the same result shape used by provider
          const rmpMapped = r.map((it) => ({ title: it.name, url: it.url, snippet: '' }));
          results = [...rmpMapped, ...results].slice(0, limit);
        } catch (err:any) {
          // ignore rmp failures and continue with provider results
        }
      }
    } catch (err:any) {
      spinner.stop();
      return { success: false, message: `Search failed: ${err.message || err}` };
    }
    spinner.stop();

    // Build a short summary (concat snippets)
    const snippets = results.map((r) => r.snippet || '').filter(Boolean);
    const summary = snippets.length > 0 ? snippets.join('\n\n').substring(0, 1200) : 'No snippets available.';

    const rec = {
      query,
      timestamp: Date.now(),
      results: results.map((r) => ({ title: r.title, url: r.url, snippet: r.snippet })),
      summary,
    };

    const dir = this.library.save(rec);

    context.output.log(`Saved research to ${dir}`, 'success');
    return { success: true, message: `Found ${results.length} results`, data: { dir, results } };
  }

  register(program: CommanderProgram): void {
    program
      .command(this.name)
      .description(this.description)
      .argument('<query>', 'Search query')
      .option('--limit <n>', 'Number of results to fetch', '5')
      .option('--rmp', 'Also search RateMyProfessors and include results')
      .action(async (query: string, options: any) => {
        // Minimal output wrapper used by execute
        const output = {
          log: (m: string, level = 'info') => {
            if (level === 'error') console.error(m); else console.log(m);
          },
          spinner: (_msg: string) => ({ stop: () => {} }),
          json: (o: any) => console.log(JSON.stringify(o, null, 2)),
          table: (rows: any) => console.table(rows),
        };

        const ctx: CliContext = { args: [query], options, output };
        const res = await this.execute(ctx);
        if (!res.success) {
          console.error(res.message);
          process.exit(1);
        }
        if (res.message) console.log(res.message);
        if (res.data) console.log(JSON.stringify(res.data, null, 2));
      });
  }

  getHelp(): HelpSection {
    return {
      title: 'Web Research Command',
      description: `
Search the web for a query, fetch the top results, and save a research record in the 'research/' folder.

USAGE:
  toolkit web-research <query> [--limit=5] [--json]

EXAMPLES:
  toolkit web-research "climate change mitigation" --limit=3
  toolkit web-research "NJIT research centers" --json
      `,
      examples: ['web-research "machine learning"', 'web-research "climate change" --limit=3 --json'],
      relatedTopics: ['quick-start', 'extending-toolkit'],
    };
  }

  validate(context: CliContext): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (context.args.length === 0) errors.push('A search query is required');
    return { valid: errors.length === 0, errors };
  }
}
