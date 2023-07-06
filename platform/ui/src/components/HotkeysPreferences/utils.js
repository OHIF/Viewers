import { hotkeysValidators } from './hotkeysValidators';

/**
 * Split hotkeys definitions and create hotkey related tuples
 *
 * @param {array} hotkeyDefinitions
 * @returns {array} array of tuples consisted of command name and hotkey definition
 */
const splitHotkeyDefinitionsAndCreateTuples = hotkeyDefinitions => {
  const splitedHotkeys = [];
  const arrayHotkeys = Object.entries(hotkeyDefinitions).sort((x, y) => {
    const labelX = x[1].label.toUpperCase(); // ignore upper and lowercase
    const labelY = y[1].label.toUpperCase(); // ignore upper and lowercase
    if (labelX < labelY) {
      return -1;
    }
    if (labelX > labelY) {
      return 1;
    }

    // names must be equal
    return 0;
  });


  if (arrayHotkeys.length) {
    const halfwayThrough = Math.ceil(arrayHotkeys.length / 2);
    splitedHotkeys.push(arrayHotkeys.slice(0, halfwayThrough));
    splitedHotkeys.push(
      arrayHotkeys.slice(halfwayThrough, arrayHotkeys.length)
    );
  }

  return splitedHotkeys;
};

/**
 * Validate a hotkey change
 *
 * @param {Object} arguments
 * @param {string} arguments.commandName command name or id
 * @param {array} arguments.pressedKeys new keys
 * @param {array} arguments.hotkeys current hotkeys
 * @returns {Object} {error} validation error
 */
const validate = ({ commandName, pressedKeys, hotkeys }) => {
  for (const validator of hotkeysValidators) {
    const validation = validator({
      commandName,
      pressedKeys,
      hotkeys,
    });

    if (validation && validation.error) {
      return validation;
    }
  }

  return { error: undefined };
};

export { validate, splitHotkeyDefinitionsAndCreateTuples };
