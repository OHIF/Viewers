import validate from 'validate.js';
/**
 * check if the value is strictly equal to options
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
  const dicomArrayValue = dicomTagToArray(value);

  // If options is an array, then we need to validate each element in the array
  if (Array.isArray(testValue)) {
    // If the array has only one element, then we need to compare the value to that element
    if (testValue.length !== dicomArrayValue.length) {
      return `${key} must be an array of length ${testValue.length}`;
    } else {
      for (let i = 0; i < testValue.length; i++) {
        if (testValue[i] !== dicomArrayValue[i]) {
          return `${key} ${testValue[i]} must equal ${dicomArrayValue[i]}`;
        }
      }
    }
  } else if (testValue !== dicomArrayValue[0]) {
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
 *           = 'Attenuation' (Fail)
 * */
validate.validators.doesNotEqual = function (value, options, key) {
  const testValue = getTestValue(options);
  const dicomArrayValue = dicomTagToArray(value);

  if (Array.isArray(testValue)) {
    if (testValue.length === dicomArrayValue.length) {
      let score = 0;
      testValue.forEach((x, i) => {
        if (x === dicomArrayValue[i]) {
          score++;
        }
      });
      if (score === testValue.length) {
        return `${key} must not equal to ${testValue}`;
      }
    }
  } else if (testValue === dicomArrayValue[0]) {
    console.log(dicomArrayValue, testValue);
    return `${key} must not equal to ${testValue}`;
  }
};

/**
 * Check if a value includes one or more specified options.
 *
 * @example
 * value = ['abc', 'def', 'GHI']
 * testValue = ‘abc’ (Fail)
 *           = ‘dog’ (Fail)
 *           = [‘abc’] (Valid)
 *           = [‘att’, ‘abc’] (Valid)
 *           = ['abc', 'def', 'dog'] (Valid)
 *           = ['cat', 'dog'] (Fail)
 *
 * value = ['Attenuation Corrected']
 * testValue = 'Attenuation Corrected' (Fail)
 *           = ['Attenuation Corrected', 'Corrected'] (Valid)
 *           = ['Attenuation', 'Corrected'] (Fail)
 *
 * value = 'Attenuation Corrected'
 * testValue = ['Attenuation Corrected', 'Corrected'] (Valid)
 *           = ['Attenuation', 'Corrected'] (Fail)
 * */
validate.validators.includes = function (value, options, key) {
  const testValue = getTestValue(options);
  const dicomArrayValue = dicomTagToArray(value);

  if (Array.isArray(testValue)) {
    const includedValues = testValue.filter(el => dicomArrayValue.includes(el));
    if (includedValues.length === 0) {
      return `${key} must include at least one of the following values: ${testValue.join(', ')}`;
    }
  } else {
    return `${key} ${testValue} must be an array`;
  }
  // else if (!value.includes(testValue)) {
  //   return `${key} ${value} must include ${testValue}`;
  // }
};
/**
 * Check if a value does not include one or more specified options.
 *
 * @example
 * value = ['abc', 'def', 'GHI']
 * testValue = ['Corr'] (Valid)
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
  const testValue = getTestValue(options);
  const dicomArrayValue = dicomTagToArray(value);

  // if (!Array.isArray(value) || value.length === 1) {
  //   return `${key} is not allowed as a single value`;
  // }
  if (Array.isArray(testValue)) {
    const includedValues = testValue.filter(el => dicomArrayValue.includes(el));
    if (includedValues.length > 0) {
      return `${key} must not include the following value: ${includedValues}`;
    }
  } else {
    return `${key} ${testValue} must be an array`;
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
 * @example
 * value = 30
 * testValue = 20 (Valid)
 *           = 40 (Fail)
 *
 * */
validate.validators.greaterThan = function (value, options, key) {
  const testValue = getTestValue(options);
  if (Array.isArray(value) || typeof value === 'string') {
    return `${key} is not allowed as an array or string`;
  }
  if (Array.isArray(testValue)) {
    if (testValue.length === 1) {
      if (!(value >= testValue[0])) {
        return `${key}  must be greater than or equal to ${testValue[0]}, but was ${value}`;
      }
    } else if (testValue.length > 1) {
      return key + ' must be an array of length 1';
    }
  } else {
    if (!(value >= testValue)) {
      return key + ' must be greater than ' + testValue;
    }
  }
};
/**
 * @example
 * value = 30
 * testValue = 40 (Valid)
 *           = 20 (Fail)
 *
 * */
validate.validators.lessThan = function (value, options, key) {
  const testValue = getTestValue(options);
  if (Array.isArray(testValue)) {
    if (testValue.length === 1) {
      if (!(value <= testValue[0])) {
        return `${key}  must be less than or equal to ${testValue[0]}, but was ${value}`;
      }
    } else if (testValue.length > 1) {
      return key + ' must be an array of length 1';
    }
  } else {
    if (!(value <= testValue)) {
      return key + ' must be less than ' + testValue;
    }
  }
};
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

validate.validators.notNull = value =>
  value === null || value === undefined ? 'Value is null' : undefined;
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
export default validate;
