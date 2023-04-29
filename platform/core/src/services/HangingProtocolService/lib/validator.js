import validate from 'validate.js';

validate.validators.equals = function(value, options, key, attributes) {
  const testValue = options?.value ?? options;
  if (value !== testValue) {
    return key + 'must equal ' + testValue;
  }
};

validate.validators.doesNotEqual = function(value, options, key) {
  const testValue = options?.value ?? options;
  if (value === testValue) {
    return key + 'cannot equal ' + testValue;
  }
};

// Ignore case contains.
// options testValue MUST be in lower case already, otherwise it won't match
validate.validators.containsI = function (value, options, key) {
  const testValue = options?.value ?? options;
  if (Array.isArray(value)) {
    if (
      value.some(
        item => !validate.validators.containsI(item.toLowerCase(), options, key)
      )
    ) {
      return undefined;
    }
    return `No item of ${value.join(',')} contains ${JSON.stringify(
      testValue
    )}`;
  }
  if (Array.isArray(testValue)) {
    if (
      testValue.some(
        subTest => !validate.validators.containsI(value, subTest, key)
      )
    ) {
      return;
    }
    return `${key} must contain at least one of ${testValue.join(',')}`;
  }
  if (
    testValue &&
    value.indexOf &&
    value.toLowerCase().indexOf(testValue) === -1
  ) {
    return key + 'must contain any case of' + testValue;
  }
};

validate.validators.contains = function(value, options, key) {
  const testValue = options?.value ?? options;
  if (Array.isArray(value)) {
    if (value.some(item => !validate.validators.contains(item, options, key))) {
      return undefined;
    }
    return `No item of ${value.join(',')} contains ${JSON.stringify(
      testValue
    )}`;
  }
  if (Array.isArray(testValue)) {
    if (
      testValue.some(
        subTest => !validate.validators.contains(value, subTest, key)
      )
    ) {
      return;
    }
    return `${key} must contain at least one of ${testValue.join(',')}`;
  }
  if (testValue && value.indexOf && value.indexOf(testValue) === -1) {
    return key + 'must contain ' + testValue;
  }
};

validate.validators.doesNotContain = function(value, options, key) {
  if (options && value.indexOf && value.indexOf(options.value) !== -1) {
    return key + 'cannot contain ' + options.value;
  }
};

validate.validators.startsWith = function(value, options, key) {
  if (options && value.startsWith && !value.startsWith(options.value)) {
    return key + 'must start with ' + options.value;
  }
};

validate.validators.endsWith = function(value, options, key) {
  if (options && value.endsWith && !value.endsWith(options.value)) {
    return key + 'must end with ' + options.value;
  }
};

const getTestValue = options => options?.value ?? options;

validate.validators.greaterThan = function(value, options, key) {
  const testValue = getTestValue(options);
  if (value === undefined || value === null || value <= testValue) {
    return key + 'with value ' + value + ' must be greater than ' + testValue;
  }
};

validate.validators.range = function(value, options, key) {
  const testValue = getTestValue(options);
  if (value === undefined || value < testValue[0] || value > testValue[1]) {
    return (
      key +
      'with value ' +
      value +
      ' must be between ' +
      testValue[0] +
      ' and ' +
      testValue[1]
    );
  }
};

validate.validators.notNull = value =>
  value === null || value === undefined ? 'Value is null' : undefined;

export default validate;
