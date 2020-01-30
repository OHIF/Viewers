import { hotkeysValidators } from './hotkeysValidators';

const validateCommandKey = ({ commandName, pressedKeys, hotkeys }) => {
  for (const validator of hotkeysValidators) {
    const validation = validator({
      commandName,
      pressedKeys,
      hotkeys,
    });
    if (validation && validation.hasError) {
      return validation;
    }
  }

  return {
    hasError: false,
    errorMessage: undefined,
  };
};

export { validateCommandKey };
