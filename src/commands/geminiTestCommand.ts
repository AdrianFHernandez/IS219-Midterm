import type { Command as CommanderProgram } from 'commander';
import type { Command } from '../core/command';
import type { GeminiService } from '../services/geminiService';

export class GeminiTestCommand implements Command {
  name = 'gemini-test';
  description = 'Run a quick Gemini API test (model + key)';

  constructor(private readonly service: GeminiService | null) {}

  register(program: CommanderProgram): void {
    program
      .command(this.name)
      .description(this.description)
      .option('-m, --model <model>', 'Gemini model to test', 'models/gemini-1.0')
      .action(async (options: { model: string }) => {
        if (!this.service) {
          process.stderr.write('No Gemini service configured (GEMINI_API_KEY missing).\n');
          process.exitCode = 1;
          return;
        }

        try {
          const prompt = 'Please reply with the single word: PONG';
          const result = await this.service.generate({ model: options.model, prompt });
          process.stdout.write('Gemini API call succeeded. Output:\n');
          process.stdout.write(result.text + '\n');
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          process.stderr.write(`Gemini API error: ${msg}\n`);
          process.exitCode = 1;
        }
      });
  }
}
