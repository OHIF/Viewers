import { useSystem } from '../contextProviders/SystemProvider';

/**
 * Hook that provides a runCommand function for executing commands
 * @returns A memoized runCommand function
 */
export function useRunCommand() {
  const { commandsManager } = useSystem();

  const runCommand = (commandName: string, commandOptions: Record<string, unknown> = {}) => {
    return commandsManager.runCommand(commandName, commandOptions);
  };

  return runCommand;
}
