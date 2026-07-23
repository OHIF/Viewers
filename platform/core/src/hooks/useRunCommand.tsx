import { useCallback } from 'react';
import { useSystem } from '../contextProviders/SystemProvider';

/**
 * Hook that provides a runCommand function for executing commands
 * @returns A memoized runCommand function
 */
export function useRunCommand() {
  const { commandsManager } = useSystem();

  const runCommand = useCallback(
    (commandName: string, commandOptions: Record<string, unknown> = {}) => {
      return commandsManager.runCommand(commandName, commandOptions);
    },
    [commandsManager]
  );

  return runCommand;
}
