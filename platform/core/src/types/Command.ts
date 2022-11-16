export interface Command {
  commandName: string;
  commandOptions?: Record<string, unknown>;
  context?: string;
}

export default Command;
