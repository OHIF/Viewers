import { MODIFIER_KEYS, DISALLOWED_COMBINATIONS } from './hotkeysConfig';
import i18n from 'i18next';

const formatPressedKeys = pressedKeysArray => pressedKeysArray.join('+');

const findConflictingCommand = (hotkeys, currentCommandName, pressedKeys) => {
  let firstConflictingCommand = undefined;
  const formatedPressedHotkeys = formatPressedKeys(pressedKeys);

  for (const commandName in hotkeys) {
    const toolHotkeys = hotkeys[commandName].keys;
    const formatedToolHotkeys = formatPressedKeys(toolHotkeys);

    if (formatedPressedHotkeys === formatedToolHotkeys && commandName !== currentCommandName) {
      firstConflictingCommand = hotkeys[commandName];
      break;
    }
  }

  return firstConflictingCommand;
};

const ERROR_MESSAGES = {
  MODIFIER: i18n.t('HotkeysValidators:It\'s not possible to define only modifier keys (ctrl, alt and shift) as a shortcut'),
  EMPTY: i18n.t('HotkeysValidators:Field can\'t be empty'),
};

// VALIDATORS

const modifierValidator = ({ pressedKeys }) => {
  const lastPressedKey = pressedKeys[pressedKeys.length - 1];
  // Check if it has a valid modifier
  const isModifier = MODIFIER_KEYS.includes(lastPressedKey);
  if (isModifier) {
    return { error: ERROR_MESSAGES.MODIFIER };
  }
};

const emptyValidator = ({ pressedKeys = [] }) => {
  if (!pressedKeys.length) {
    return { error: ERROR_MESSAGES.EMPTY };
  }
};

const conflictingValidator = ({ commandName, pressedKeys, hotkeys }) => {
  const conflictingCommand = findConflictingCommand(hotkeys, commandName, pressedKeys);

  if (conflictingCommand) {
    return {
      error: i18n.t('HotkeysValidators:Hotkey is already in use', {action: conflictingCommand.label, pressedKeys: pressedKeys }),
    };
  }
};

const disallowedValidator = ({ pressedKeys = [] }) => {
  const lastPressedKey = pressedKeys[pressedKeys.length - 1];
  const modifierCommand = formatPressedKeys(pressedKeys.slice(0, pressedKeys.length - 1));

  const disallowedCombination = DISALLOWED_COMBINATIONS[modifierCommand];
  const hasDisallowedCombinations = disallowedCombination
    ? disallowedCombination.includes(lastPressedKey)
    : false;

  if (hasDisallowedCombinations) {
    return {
      error: i18n.t('HotkeysValidators:Shortcut combination is not allowed', {pressedKeys: formatPressedKeys(pressedKeys)}),
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
