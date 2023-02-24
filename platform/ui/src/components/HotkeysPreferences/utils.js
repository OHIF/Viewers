import { hotkeysValidators } from './hotkeysValidators';

/**
 * Split hotkeys definitions and create hotkey related tuples
 *
 * @param {array} hotkeyDefinitions
 * @returns {array} array of tuples consisted of command name and hotkey definition
 */
const splitHotkeyDefinitionsAndCreateTuples = hotkeyDefinitions => {
  const splitedHotkeys = [];
  const arrayHotkeys = Object.entries(hotkeyDefinitions);

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
 * Remove validation errors as necessary
 *
 * @param {Object} currentErrors
 * @param {array} pressedKeys new keys
 * @param {string} id id
 * @param {array} arguments.hotkeys current hotkeys
 * @returns {Object} {error} validation error
 */
const removeErrors = (currentErrors, pressedKeys, id, hotkeys) => {
  const pressedLabel = hotkeys[id].label;
  let newLabel;
  if (Object.keys(currentErrors.currentErrors).length) {
    // First delete the error once we delete the error
    Object.keys(currentErrors.currentErrors).every((key) => {
      if (currentErrors.currentErrors[key]) {
        const [errorLabel, errorKeys] = extractInfoFromError(currentErrors.currentErrors[key]);
        if (errorLabel === pressedLabel && pressedKeys.join("+") !== errorKeys) {
          hotkeys[key]
          newLabel = hotkeys[key].label
          currentErrors.currentErrors[key] = undefined
          return false
        }
      }
      return true
    })
    // Then we relabel old errors so that all duplicate keys have the same error
    Object.keys(currentErrors.currentErrors).forEach((key) => {
      const error = currentErrors.currentErrors[key]
      if (error) {
        const [errorLabel, errorKeys] = extractInfoFromError(error);
        if (errorLabel === pressedLabel && pressedKeys.join("+") !== errorKeys) { 
          currentErrors.currentErrors[key] = currentErrors.currentErrors[key].replace(
            `"${errorLabel}"`,
            `"${newLabel}"`
          )
        }
      }
    })
  }
  
  return {currentErrors: currentErrors}
}

/**
 * Validate a hotkey change
 *
 * @param {Object} arguments
 * @param {string} arguments.commandName command name or id
 * @param {array} arguments.pressedKeys new keys
 * @param {array} arguments.hotkeys current hotkeys
 * @param {Object} currentErrors
 * @returns {Object} {error} validation error
 */
const validate = ({ commandName, pressedKeys, hotkeys, currentErrors }) => {
  
  const updatedErrors = removeErrors(currentErrors, pressedKeys, commandName, hotkeys)
  for (const validator of hotkeysValidators) {
    const validation = validator({
      commandName,
      pressedKeys,
      hotkeys
    });
    
    if (validation && validation.error) {
      return {...validation, ...updatedErrors};
    }
  }
  return { error: undefined, ...updatedErrors };
};

/**
 * Extract relevant toolName and key data from a validation error
 *
 * @param {Object} error {error}
 * @returns {array} [toolName, key] toolName and key from error
 */
const extractInfoFromError = error => {
  const regex = /"([^"]+)"[^"]+"([^"]+)"/;
  const match = error.match(regex);
  if (match !== null) {
    const toolName = match[1];
    const key = match[2];
    return [toolName, key];
  } else {
    return null;
  }
};

export { validate, splitHotkeyDefinitionsAndCreateTuples, extractInfoFromError };