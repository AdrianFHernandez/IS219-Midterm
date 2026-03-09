import type { Command as CommanderProgram } from 'commander';
import type { Command } from '../core/command';
import type { ScreenshotService } from '../services/screenshotService';

export class ScreenshotCommand implements Command {
  name = 'screenshot';
  description = 'Take a screenshot of a website and get Gemini design feedback';

  constructor(private readonly service: ScreenshotService) {}

  register(program: CommanderProgram): void {
    program
      .command(this.name)
      .description(this.description)
      .argument('<url>', 'Website URL')
      .option('-m, --model <model>', 'Gemini model to use', 'models/gemini-1.0')
      .option('--no-gemini', 'Do not call Gemini; only save screenshot')
      .option('--no-compress', 'Do not compress image before sending to Gemini')
      .option('--max-width <n>', 'Max width when compressing', '1600')
      .option('--quality <n>', 'JPEG quality (1-100) when compressing', '80')
      .action(async (url: string, options: { model: string; gemini: boolean; compress: boolean; maxWidth: string; quality: string }) => {
        try {
          const result = await this.service.captureAndReview(
            url,
            'images',
            options.model,
            options.compress,
            Number(options.maxWidth ?? 1600),
            Number(options.quality ?? 80)
          );
          process.stdout.write(`Saved screenshot to: ${result.path}\n`);
          if (result.review) {
            process.stdout.write('--- Gemini feedback ---\n');
            process.stdout.write(`${result.review}\n`);
          } else {
            process.stdout.write('No Gemini feedback available; screenshot saved.\n');
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          process.stderr.write(`${message}\n`);
          process.exitCode = 1;
        }
      });
  }
}
