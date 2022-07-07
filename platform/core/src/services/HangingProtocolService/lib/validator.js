import validate from 'validate.js';

validate.validators.equals = function (value, options, key, attributes) {
  const testValue = options?.value ?? options;
  if (value !== testValue) {
    return key + 'must equal ' + testValue;
  }
};

validate.validators.doesNotEqual = function (value, options, key) {
  const testValue = options?.value ?? options;
  if (value === testValue) {
    return key + 'cannot equal ' + testValue;
  }
};

validate.validators.contains = function (value, options, key) {
  const testValue = options?.value ?? options;
  if (testValue && value.indexOf && value.indexOf(testValue) === -1) {
    return key + 'must contain ' + testValue;
  }
};

validate.validators.doesNotContain = function (value, options, key) {
  if (options && value.indexOf && value.indexOf(options.value) !== -1) {
    return key + 'cannot contain ' + options.value;
  }
};

validate.validators.startsWith = function (value, options, key) {
  if (options && value.startsWith && !value.startsWith(options.value)) {
    return key + 'must start with ' + options.value;
  }
};

validate.validators.endsWith = function (value, options, key) {
  if (options && value.endsWith && !value.endsWith(options.value)) {
    return key + 'must end with ' + options.value;
  }
};

validate.validators.greaterThan = function (value, options, key) {
  const testValue = options?.value ?? options;
  if (testValue !== undefined && value <= testValue) {

    return key + 'with value ' + value + ' must be greater than ' + testValue;
  }

};

validate.validators.notNull = (value) => ((value === null || value === undefined) ? "Value is null" : undefined);

export default validate;
