export interface Command {
  commandName: string;
  commandOptions?: Record<string, unknown>;
  context?: string;
}

/**
 * This is the format used within many items for multiple commands
 */
export interface Commands {
  commands: [];
}
