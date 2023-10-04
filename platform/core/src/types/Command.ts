export interface Command {
  commandName: string;
  commandOptions?: Record<string, unknown>;
  context?: string;
}

export type RunCommand = Command | Command[];

/** A set of commands, typically contained in a tool item or other configuration */
export interface Commands {
  commands: RunCommand;
}
