import { MODIFIER_KEYS, DISALLOWED_COMBINATIONS } from './hotkeysConfig';

const formatPressedKeys = pressedKeysArray => pressedKeysArray.join('+');

const findConflictingCommand = (hotkeys, currentCommandName, pressedKeys) => {
  let firstConflictingCommand = undefined;
  const formatedPressedHotkeys = formatPressedKeys(pressedKeys);

  for (const commandName in hotkeys) {
    const toolHotkeys = hotkeys[commandName].keys;
    const formatedToolHotkeys = formatPressedKeys(toolHotkeys);

    if (
      formatedPressedHotkeys === formatedToolHotkeys &&
      commandName !== currentCommandName
    ) {
      firstConflictingCommand = hotkeys[commandName];
      break;
    }
  }

  return firstConflictingCommand;
};

const ERROR_MESSAGES = {
  MODIFIER:
    "It's not possible to define only modifier keys (ctrl, alt and shift) as a shortcut",
  EMPTY: "Field can't be empty.",
};

// VALIDATORS

const modifierValidator = ({ pressedKeys }) => {
  const lastPressedKey = pressedKeys[pressedKeys.length - 1];
  // Check if it has a valid modifier
  const isModifier = MODIFIER_KEYS.includes(lastPressedKey);
  if (isModifier) {
    return {
      hasError: true,
      errorMessage: ERROR_MESSAGES.MODIFIER,
    };
  }
};

const emptyValidator = ({ pressedKeys = [] }) => {
  if (!pressedKeys.length) {
    return {
      hasError: true,
      errorMessage: ERROR_MESSAGES.EMPTY,
    };
  }
};

const conflictingValidator = ({ commandName, pressedKeys, hotkeys }) => {
  const conflictingCommand = findConflictingCommand(
    hotkeys,
    commandName,
    pressedKeys
  );

  if (conflictingCommand) {
    return {
      hasError: true,
      errorMessage: `"${conflictingCommand.label}" is already using the "${pressedKeys}" shortcut.`,
    };
  }
};

const disallowedValidator = ({ pressedKeys = [] }) => {
  const lastPressedKey = pressedKeys[pressedKeys.length - 1];
  const modifierCommand = formatPressedKeys(
    pressedKeys.slice(0, pressedKeys.length - 1)
  );

  const disallowedCombination = DISALLOWED_COMBINATIONS[modifierCommand];
  const hasDisallowedCombinations = disallowedCombination
    ? disallowedCombination.includes(lastPressedKey)
    : false;

  if (hasDisallowedCombinations) {
    return {
      hasError: true,
      errorMessage: `"${formatPressedKeys(
        pressedKeys
      )}" shortcut combination is not allowed`,
    };
  }
};

const hotkeysValidators = [
  emptyValidator,
  modifierValidator,
  conflictingValidator,
  disallowedValidator,
];

export { hotkeysValidators };
