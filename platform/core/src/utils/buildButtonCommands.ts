import { ButtonProps, RunCommand } from '../types';

const toArray = <T>(value?: T | T[]): T[] =>
  Array.isArray(value) ? value : value != null ? [value] : [];

export const buildButtonCommands = (
  buttonProps: ButtonProps,
  baseArgs: Record<string, unknown>,
  { servicesManager, commandsManager }: AppTypes.Managers
): Array<() => unknown> => {
  const allCommands: Array<() => unknown> = [];

  // 1) normalize item-level commands
  for (const command of toArray(buttonProps.commands as RunCommand)) {
    allCommands.push(() => commandsManager.run(command, baseArgs));
  }

  // 2) normalize option-level commands
  for (const option of toArray(buttonProps.options)) {
    const shouldSkip = !option?.commands || option.explicitRunOnly;
    if (shouldSkip) {
      continue;
    }

    const valueToUse = option.value;
    for (const command of toArray(option.commands)) {
      const commandOptions = {
        ...option,
        value: valueToUse,
        options: buttonProps.options,
        servicesManager,
        commandsManager,
      };

      allCommands.push(() => commandsManager.run(command, commandOptions));
    }
  }

  return allCommands;
};
