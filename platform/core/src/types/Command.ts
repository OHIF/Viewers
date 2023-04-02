export interface Command {
  commandName: string;
  commandOptions?: Record<string, unknown>;
  context?: string;
}

/** A set of commands, typically contained in a tool item or other configuration */
export interface Commands {
  commands: Command[];
}
