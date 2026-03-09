// Lightweight, local types to avoid dependency on a shared Interfaces file
type CliContext = {
  args: string[];
  options: Record<string, unknown>;
  output: any;
  helpProvider?: any;
};

type ICommandRegistry = any;
type IHelpProvider = any;
type IOutputService = any;

/**
 * CliDispatcher implementation
 * Single Responsibility: parse arguments and dispatch to commands
 * Dependency Inversion: depends on abstractions, not concrete types
 */
export class CliDispatcher {
  constructor(
    private registry: ICommandRegistry,
    private helpProvider: IHelpProvider,
    private output: IOutputService
  ) {}

  async dispatch(args: string[]): Promise<void> {
    try {
      // Parse arguments
      const { command, args: remainingArgs } = this.registry.resolve(args);

      // No command found
      if (!command) {
        if (args.length > 0) {
          this.output.log(
            `Unknown command: ${args[0]}. Run 'help' for available commands.`,
            'error'
          );
          process.exit(1);
        }
        // Show default help if no args
        this.showDefaultHelp();
        return;
      }

      // Parse flags and arguments
      const { options, positionalArgs } = this.parseArgs(remainingArgs);

      // Handle help flag
      if (options.help) {
        const help = command.getHelp();
        if (options.json) {
          this.output.json(help);
        } else {
          this.displayHelp(help);
        }
        return;
      }

      // Create context
      const context: CliContext = {
        args: positionalArgs,
        options,
        output: this.output,
        helpProvider: this.helpProvider,
      };

      // Validate input
      const validation = command.validate(context);
      if (!validation.valid) {
        this.output.log('Validation failed:', 'error');
        validation.errors.forEach((err: string) => this.output.log(`  - ${err}`, 'error'));
        process.exit(1);
      }

      // Execute command
      const result = await command.execute(context);

      if (!result.success) {
        if (options.json) {
          this.output.json({ success: false, error: result.message });
        } else {
          this.output.log(result.message || 'Command failed', 'error');
        }
        process.exit(1);
      }

      // Output result
      if (options.json) {
        this.output.json({
          success: true,
          message: result.message,
          data: result.data,
        });
      } else if (result.message) {
        this.output.log(result.message, 'success');
      }

      if (result.data && !options.json) {
        if (Array.isArray(result.data)) {
          this.output.table(result.data);
        } else if (typeof result.data === 'object') {
          this.output.json(result.data);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.output.log(`Unexpected error: ${message}`, 'error');
      process.exit(1);
    }
  }

  private parseArgs(
    args: string[]
  ): { options: Record<string, unknown>; positionalArgs: string[] } {
    const options: Record<string, unknown> = {};
    const positionalArgs: string[] = [];

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        options[key] = value ?? true;
      } else if (arg.startsWith('-') && arg.length === 2) {
        options[arg.substring(1)] = true;
      } else {
        positionalArgs.push(arg);
      }
    }

    return { options, positionalArgs };
  }

  private showDefaultHelp(): void {
    this.output.log('219 Toolkit - AI-friendly CLI', 'info');
    this.output.log('', 'info');
    this.output.log('Usage: toolkit <command> [args] [options]', 'info');
    this.output.log('', 'info');
    this.output.log('Available commands:', 'info');
    this.output.table(
      this.registry.list().map((cmd: any) => ({
        name: cmd.name,
        aliases: cmd.aliases?.join(', ') || '-',
        description: cmd.description,
      }))
    );
    this.output.log('', 'info');
    this.output.log(
      "Run 'toolkit help <topic>' or 'toolkit <command> --help' for more info",
      'info'
    );
  }

  private displayHelp(help: { title: string; description: string; examples?: string[] }): void {
    this.output.log(`\n${help.title}`, 'info');
    this.output.log(help.description, 'info');
    if (help.examples && help.examples.length > 0) {
      this.output.log('\nExamples:', 'info');
      help.examples.forEach((ex) => this.output.log(`  $ toolkit ${ex}`, 'info'));
    }
    this.output.log('', 'info');
  }
}
