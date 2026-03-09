import type { Command as CommanderProgram } from 'commander';
import type { Command as CliCommand } from './command';

/**
 * Simple CommandRegistry for registering CLI command objects and
 * applying them to a Commander program instance.
 */
export class CommandRegistry {
  private commands: Map<string, CliCommand> = new Map();
  private aliases: Map<string, string> = new Map();

  register(command: CliCommand): void {
    const key = command.name.toLowerCase();
    this.commands.set(key, command);

    if ((command as any).aliases) {
      for (const alias of (command as any).aliases as string[]) {
        this.aliases.set(alias.toLowerCase(), key);
      }
    }
  }

  get(name: string): CliCommand | null {
    const key = name.toLowerCase();
    const resolvedKey = this.aliases.get(key) ?? key;
    return this.commands.get(resolvedKey) ?? null;
  }

  list(): CliCommand[] {
    return Array.from(this.commands.values());
  }

  resolve(args: string[]): { command: CliCommand | null; args: string[] } {
    if (args.length === 0) return { command: null, args: [] };
    const potential = this.get(args[0]);
    if (potential) return { command: potential, args: args.slice(1) };
    return { command: null, args };
  }

  apply(program: CommanderProgram): void {
    for (const cmd of this.commands.values()) {
      cmd.register(program);
    }
  }
}
