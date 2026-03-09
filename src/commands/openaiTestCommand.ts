import type { Command as CommanderProgram } from 'commander';
import type { Command } from '../core/command';
import type OpenAI from 'openai';

export class OpenAITestCommand implements Command {
  name = 'openai-test';
  description = 'Quick test to validate the OpenAI API key (models list)';

  constructor(private readonly client: OpenAI) {}

  register(program: CommanderProgram): void {
    program
      .command(this.name)
      .description(this.description)
      .action(async () => {
        try {
          // lightweight call to validate key and connectivity
          const models = await (this.client as any).models.list();
          const count = Array.isArray(models.data) ? models.data.length : 0;
          process.stdout.write(`OpenAI API OK. Models available: ${count}\n`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          process.stderr.write(`OpenAI API error: ${msg}\n`);
          process.exitCode = 1;
        }
      });
  }
}
