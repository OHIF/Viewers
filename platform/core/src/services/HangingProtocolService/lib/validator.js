import validate from 'validate.js';
/**
 * check if the value is equal to options. A number equals a numeric string:
 * `1` equals `'1'`.
 *
 * @example
 * value = ['abc', 'def', 'GHI']
 * testValue = 'abc' (Fail)
 *           = ['abc'] (Fail)
 *           = ['abc', 'def', 'GHI'] (Valid)
 *           = ['abc', 'GHI', 'def'] (Fail)
 *           = ['abc', 'def'] (Fail)
 *
 * value = 'Attenuation Corrected'
 * testValue = 'Attenuation Corrected' (Valid)
 * testValue = 'Attenuation' (Fail)
 *
 * value = ['Attenuation Corrected']
 * testValue = ['Attenuation Corrected'] (Valid)
 *           = 'Attenuation Corrected' (Valid)
 *           = 'Attenuation' (Fail)
 *
 * */
validate.validators.equals = function (value, options, key) {
  const testValue = getTestValue(options);
  if (!isEqualToTestValue(value, testValue)) {
    return `${key} must equal ${testValue}`;
  }
};
/**
 * check if the value is not equal to options
 *
 * @example
 * value = ['abc', 'def', 'GHI']
 * testValue = 'abc' (Valid)
 *           = ['abc'] (Valid)
 *           = ['abc', 'def', 'GHI'] (Fail)
 *           = ['abc', 'GHI', 'def'] (Valid)
 *           = ['abc', 'def'] (Valid)
 *
 * value = 'Attenuation Corrected'
 *       = 'Attenuation Corrected' (Fail)
 *       = 'Attenuation' (Valid)
 *
 * value = ['Attenuation Corrected']
 * testValue = ['Attenuation Corrected'] (Fail)
 *           = 'Attenuation Corrected' (Fail)
 *           = 'Attenuation' (Valid)
 * */
validate.validators.doesNotEqual = function (value, options, key) {
  const testValue = getTestValue(options);
  if (isEqualToTestValue(value, testValue)) {
    return `${key} must not equal ${testValue}`;
  }
};

/**
 * Check if a value includes one or more specified options. A single test
 * value is the same as an array of one test value.
 *
 * @example
 * value = ['abc', 'def', 'GHI']
 * testValue = ‘abc’ (Valid)
 *           = ‘dog’ (Fail)
 *           = [‘abc’] (Valid)
 *           = [‘att’, ‘abc’] (Valid)
 *           = ['abc', 'def', 'dog'] (Valid)
 *           = ['cat', 'dog'] (Fail)
 *
 * value = ['Attenuation Corrected']
 * testValue = 'Attenuation Corrected' (Valid)
 *           = ['Attenuation Corrected', 'Corrected'] (Valid)
 *           = ['Attenuation', 'Corrected'] (Fail)
 *
 * value = 'Attenuation Corrected'
 * testValue = ['Attenuation Corrected', 'Corrected'] (Valid)
 *           = ['Attenuation', 'Corrected'] (Fail)
 * */
validate.validators.includes = function (value, options, key) {
  const testValue = getTestValue(options);
  if (!includedTestValues(value, testValue).length) {
    return `${key} must include at least one of the following values: ${dicomTagToArray(testValue).join(', ')}`;
  }
};
/**
 * Check if a value does not include one or more specified options. A single
 * test value is the same as an array of one test value.
 *
 * @example
 * value = ['abc', 'def', 'GHI']
 * testValue = ['Corr'] (Valid)
 *           = 'dog' (Valid)
 *           = 'abc' (Fail)
 *           = ['abc'] (Fail)
 *           = [‘att’, ‘cor’] (Valid)
 *           = ['abc', 'def', 'dog'] (Fail)
 *
 * value = ['Attenuation Corrected']
 * testValue = 'Attenuation Corrected' (Fail)
 *           = ['Attenuation Corrected', 'Corrected'] (Fail)
 *           = ['Attenuation', 'Corrected'] (Valid)
 *
 * value = 'Attenuation Corrected'
 * testValue = ['Attenuation Corrected', 'Corrected'] (Fail)
 *           = ['Attenuation', 'Corrected'] (Valid)
 * */
validate.validators.doesNotInclude = function (value, options, key) {
  const includedValues = includedTestValues(value, getTestValue(options));
  if (includedValues.length > 0) {
    return `${key} must not include the following value: ${includedValues}`;
  }
};
// Ignore case contains.
// options testValue MUST be in lower case already, otherwise it won't match
/**
 * @example
 * value = 'Attenuation Corrected'
 * testValue = ‘Corr’ (Valid)
 *           = ‘corr’ (Valid)
 *           = [‘att’, ‘cor’] (Valid)
 *           = [‘Att’, ‘Wall’] (Valid)
 *           = [‘cat’, ‘dog’] (Fail)
 *
 * value = ['abc', 'def', 'GHI']
 * testValue = 'def' (Valid)
 *           = 'dog' (Fail)
 *           = ['gh', 'de'] (Valid)
 *           = ['cat', 'dog'] (Fail)
 *
 * */
validate.validators.containsI = function (value, options, key) {
  const testValue = getTestValue(options);
  if (Array.isArray(value)) {
    if (value.some(item => !validate.validators.containsI(item.toLowerCase(), options, key))) {
      return undefined;
    }
    return `No item of ${value.join(',')} contains ${JSON.stringify(testValue)}`;
  }
  if (Array.isArray(testValue)) {
    if (
      testValue.some(subTest => !validate.validators.containsI(value, subTest.toLowerCase(), key))
    ) {
      return;
    }
    return `${key} must contain at least one of ${testValue.join(',')}`;
  }
  if (testValue && value.indexOf && value.toLowerCase().indexOf(testValue.toLowerCase()) === -1) {
    return key + 'must contain any case of' + testValue;
  }
};
/**
 * @example
 * value = 'Attenuation Corrected'
 * testValue = ‘Corr’ (Valid)
 *           = ‘corr’ (Fail)
 *           = [‘att’, ‘cor’] (Fail)
 *           = [‘Att’, ‘Wall’] (Valid)
 *           = [‘cat’, ‘dog’] (Fail)
 *
 * value = ['abc', 'def', 'GHI']
 * testValue = 'def' (Valid)
 *           = 'dog' (Fail)
 *           = ['cat', 'de'] (Valid)
 *           = ['cat', 'dog'] (Fail)
 *
 * */
validate.validators.contains = function (value, options, key) {
  const testValue = getTestValue(options);
  if (Array.isArray(value)) {
    if (value.some(item => !validate.validators.contains(item, options, key))) {
      return undefined;
    }
    return `No item of ${value.join(',')} contains ${JSON.stringify(testValue)}`;
  }
  if (Array.isArray(testValue)) {
    if (testValue.some(subTest => !validate.validators.contains(value, subTest, key))) {
      return;
    }
    return `${key} must contain at least one of ${testValue.join(',')}`;
  }
  if (testValue && value.indexOf && value.indexOf(testValue) === -1) {
    return key + 'must contain ' + testValue;
  }
};

// Custom validator: containsAll
// Checks that all items in testValue are present in value
validate.validators.containsAll = function (value, options, key) {
  const testValue = getTestValue(options);
  if (!Array.isArray(value) || !Array.isArray(testValue)) {
    return `${key} must be an array and test value must be an array.`;
  }
  const missing = testValue.filter(item => !value.includes(item));
  if (missing.length > 0) {
    return `${key} must contain all of: ${testValue.join(', ')}. Missing: ${missing.join(', ')}`;
  }
};

/**
 * @example
 * value = 'Attenuation Corrected'
 * testValue = ‘Corr’ (Fail)
 *           = ‘corr’ (Valid)
 *           = [‘att’, ‘cor’] (Valid)
 *           = [‘Att’, ‘Wall’] (Fail)
 *           = [‘cat’, ‘dog’] (Valid)
 *
 * value = ['abc', 'def', 'GHI']
 * testValue = 'def' (Fail)
 *           = 'dog' (Valid)
 *           = ['cat', 'de'] (Fail)
 *           = ['cat', 'dog'] (Valid)
 *
 * */
validate.validators.doesNotContain = function (value, options, key) {
  const containsResult = validate.validators.contains(value, options, key);
  if (!containsResult) {
    return `No item of ${value} should contain ${getTestValue(options)}`;
  }
};

/**
 * @example
 * value = 'Attenuation Corrected'
 * testValue = ‘Corr’ (Fail)
 *           = ‘corr’ (Fail)
 *           = [‘att’, ‘cor’] (Fail)
 *           = [‘Att’, ‘Wall’] (Fail)
 *           = [‘cat’, ‘dog’] (Valid)
 *
 * value = ['abc', 'def', 'GHI']
 * testValue = 'DEF' (Fail)
 *           = 'dog' (Valid)
 *           = ['cat', 'gh'] (Fail)
 *           = ['cat', 'dog'] (Valid)
 *
 * */
validate.validators.doesNotContainI = function (value, options, key) {
  const containsResult = validate.validators.containsI(value, options, key);
  if (!containsResult) {
    return `No item of ${value} should not contain ${getTestValue(options)}`;
  }
};
/**
 * @example
 * value = 'Attenuation Corrected'
 * testValue = ‘Corr’ (Fail)
 *           = ‘Att’ (Fail)
 *           = ['cat', 'dog', 'Att'] (Valid)
 *           = [‘cat’, ‘dog’] (Fail)
 *
 * value = ['abc', 'def', 'GHI']
 * testValue = 'deg' (Valid)
 *           = ['cat', 'GH']  (Valid)
 *           = ['cat', 'gh'] (Fail)
 *           = ['cat', 'dog'] (Fail)
 *
 * */
validate.validators.startsWith = function (value, options, key) {
  let testValues = getTestValue(options);

  if (typeof testValues === 'string') {
    testValues = [testValues];
  }

  if (typeof value === 'string') {
    if (!testValues.some(testValue => value.startsWith(testValue))) {
      return key + ' must start with any of these values: ' + testValues;
    }
  } else if (Array.isArray(value)) {
    let valid = false;
    for (let i = 0; i < value.length; i++) {
      for (let j = 0; j < testValues.length; j++) {
        if (value[i].startsWith(testValues[j])) {
          valid = true; // set valid flag to true if a match is found
          break;
        }
      }
      if (valid) {
        return undefined; // break out of loop if a match is found
      }
    }

    if (!valid) {
      return key + ' must start with any of these values: ' + testValues; // return undefined if no match is found
    }
  } else {
    return 'Value must be a string or an array';
  }
};

/**
 * @example
 * value = 'Attenuation Corrected'
 * testValue = ‘TED’ (Fail)
 *           = ‘ted’ (Valid)
 *           = ['cat', 'dog', 'ted'] (Valid)
 *           = [‘cat’, ‘dog’] (Fail)
 *
 * value = ['abc', 'def', 'GHI']
 * testValue = 'deg' (Valid)
 *           = ['cat', 'HI']  (Valid)
 *           = ['cat', 'hi'] (Fail)
 *           = ['cat', 'dog'] (Fail)
 *
 * */
validate.validators.endsWith = function (value, options, key) {
  let testValues = getTestValue(options);

  if (typeof testValues === 'string') {
    testValues = [testValues];
  }

  if (typeof value === 'string') {
    if (!testValues.some(testValue => value.endsWith(testValue))) {
      return key + ' must end with any of these values: ' + testValues;
    }
  } else if (Array.isArray(value)) {
    let valid = false;
    for (let i = 0; i < value.length; i++) {
      for (let j = 0; j < testValues.length; j++) {
        if (value[i].endsWith(testValues[j])) {
          valid = true; // set valid flag to true if a match is found
          break;
        }
      }
      if (valid) {
        return undefined; // break out of loop if a match is found
      }
    }

    if (!valid) {
      return key + ' must end with any of these values: ' + testValues; // return undefined if no match is found
    }
  } else {
    return key + ' must be a string or an array';
  }
};
/**
 * Creates a validator that compares a numeric value with one test value. The
 * test value can be a number, `{ value }`, or an array of one number.
 *
 * @param compare - the comparison of the value with the test value
 * @param relation - the relation, for the error message
 * @param rejectArrayOrString - fail an array or a string value
 */
const createNumberValidator = (compare, relation, rejectArrayOrString) =>
  function (value, options, key) {
    if (rejectArrayOrString && (Array.isArray(value) || typeof value === 'string')) {
      return `${key} is not allowed as an array or string`;
    }
    let testValue = getTestValue(options);
    if (Array.isArray(testValue)) {
      if (testValue.length > 1) {
        return key + ' must be an array of length 1';
      }
      if (testValue.length === 0) {
        return;
      }
      testValue = testValue[0];
    }
    if (!compare(value, testValue)) {
      return `${key} must be ${relation} ${testValue}, but was ${value}`;
    }
  };

/**
 * Strictly greater than.
 *
 * @example
 * value = 30
 * testValue = 20 (Valid)
 *           = 30 (Fail)
 *           = 40 (Fail)
 *
 * */
validate.validators.greaterThan = createNumberValidator((a, b) => a > b, 'greater than', true);
/**
 * @example
 * value = 30
 * testValue = 20 (Valid)
 *           = 30 (Valid)
 *           = 40 (Fail)
 *
 * */
validate.validators.greaterThanOrEqual = createNumberValidator(
  (a, b) => a >= b,
  'greater than or equal to',
  true
);
/**
 * Strictly less than.
 *
 * @example
 * value = 30
 * testValue = 40 (Valid)
 *           = 30 (Fail)
 *           = 20 (Fail)
 *
 * */
validate.validators.lessThan = createNumberValidator((a, b) => a < b, 'less than', false);
/**
 * @example
 * value = 30
 * testValue = 40 (Valid)
 *           = 30 (Valid)
 *           = 20 (Fail)
 *
 * */
validate.validators.lessThanOrEqual = createNumberValidator(
  (a, b) => a <= b,
  'less than or equal to',
  false
);
/**
 * @example

 *
 * value = 50
 * testValue = [10,60] (Valid)
 *           = [60, 10] (Valid)
 *           = [0, 10] (Fail)
 *           = [70, 80] (Fail)
 *           = 45  (Fail)
 *           = [45] (Fail)
 *
 * */
validate.validators.range = function (value, options, key) {
  const testValue = getTestValue(options);
  if (Array.isArray(testValue) && testValue.length === 2) {
    const min = Math.min(testValue[0], testValue[1]);
    const max = Math.max(testValue[0], testValue[1]);
    if (value === undefined || value < min || value > max) {
      return `${key} with value ${value} must be between ${min} and ${max}`;
    }
  } else {
    return `${key} must be an array of length 2`;
  }
};

/** `notNull: true` fails on no value, and `notNull: false` fails on a value. */
validate.validators.notNull = (value, options) => {
  const isNull = value === null || value === undefined;
  if (getTestValue(options) === false) {
    return isNull ? undefined : 'Value is not null';
  }
  return isNull ? 'Value is null' : undefined;
};
const getTestValue = options => {
  if (Array.isArray(options)) {
    return options.map(option => option?.value ?? option);
  } else {
    return options?.value ?? options;
  }
};
const dicomTagToArray = value => {
  let dicomArrayValue;
  if (!Array.isArray(value)) {
    dicomArrayValue = [value];
  } else {
    dicomArrayValue = [...value];
  }
  return dicomArrayValue;
};
/** The number of a number or a numeric string, else `undefined`. */
const toFinite = value => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  const number = typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(number) ? number : undefined;
};
/**
 * The equality of two single values, as in `@cornerstonejs/metadata`: `===`,
 * or, when one value is a number, equal numbers, so `'1'` equals `1`.
 */
const isEqualElement = (a, b) => {
  if (a === b) {
    return true;
  }
  if (typeof a !== 'number' && typeof b !== 'number') {
    return false;
  }
  const x = toFinite(a);
  return x !== undefined && x === toFinite(b);
};
/** The test values that the value holds, with {@link isEqualElement}. */
const includedTestValues = (value, testValue) => {
  const values = dicomTagToArray(value);
  return dicomTagToArray(testValue).filter(item =>
    values.some(element => isEqualElement(element, item))
  );
};
/**
 * The equality of `equals` and `doesNotEqual`. A single value is the same as an
 * array of one value, so `'abc'` equals `['abc']`, but not `['abc', 'def']`.
 * Two arrays are equal when they have the same length and the same elements,
 * in the same order. Use `includes` to test that a value is one of a list.
 */
const isEqualToTestValue = (value, testValue) => {
  const values = dicomTagToArray(value);
  const testValues = dicomTagToArray(testValue);
  return (
    values.length === testValues.length &&
    testValues.every((item, index) => isEqualElement(item, values[index]))
  );
};
export default validate;
