#!/usr/bin/env node

import { Command as Commander } from 'commander';
import { loadEnv } from './config/env';
import { CommandRegistry } from './core/commandRegistry';
import { createContainer } from './container';
import { GeminiCommand } from './commands/geminiCommand';
import { ImageGenerateCommand } from './commands/imageGenerateCommand';
import { WebSearchCommand as OpenAIWebSearchCommand } from './commands/webSearchCommand';
import { ScreenshotCommand } from './commands/screenshotCommand';
import { WebResearchCommand } from './commands/WebResearchCommand';
import { GeminiTestCommand } from './commands/geminiTestCommand';
import { OpenAITestCommand } from './commands/openaiTestCommand';
import { ProfessorSearchCommand } from './commands/ProfessorSearchCommand';

export async function main(): Promise<void> {
  loadEnv();

  const container = createContainer();
  const program = new Commander();
  program
    .name('ai-toolkit')
    .description('CLI AI toolkit')
    .version('0.1.0');

  const registry = new CommandRegistry();

  // Register available commander-style commands
  registry.register(new GeminiCommand(container.geminiService));
  registry.register(new ImageGenerateCommand(container.imageService));
  registry.register(new OpenAIWebSearchCommand(container.webSearchService));
  registry.register(new ProfessorSearchCommand());
  // research-oriented command (saves research records)
  registry.register(new WebResearchCommand());
  if (container.screenshotService) {
    registry.register(new ScreenshotCommand(container.screenshotService));
  }
  // Optional test commands if available
  try {
    registry.register(new GeminiTestCommand(container.geminiService));
  } catch (_) {}
  try {
    registry.register(new OpenAITestCommand(container.client));
  } catch (_) {}

  registry.apply(program);

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
