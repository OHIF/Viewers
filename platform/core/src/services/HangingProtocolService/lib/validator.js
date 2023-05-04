import validate from 'validate.js';

// The equals function is used to validate if a given value is equal to another value or an array of values.

validate.validators.equals = function(value, options, key) {
  const testValue = getTestValue(options);

  // If options is an array, then we need to validate each element in the array
  if (Array.isArray(testValue)) {
    // If the array has only one element, then we need to compare the value to that element
    if (testValue.length === 1) {
      if (testValue[0] !== value) {
        return `${key} must equal ${testValue[0]}`;
      }
    } else if (testValue.length !== value.length) {
      return `${key} must be an array of length ${testValue.length}`;
    }
    // We need to compare each element in the array
    else {
      if (JSON.stringify(testValue) !== JSON.stringify(value)) {
        return `${key} must strictly equal ${testValue}`;
      }
    }
  }

  // If options is not an array, we can compare the value directly
  else if (value !== testValue) {
    return `${key} must equal ${testValue}`;
  }
};
// The doesNotEqual function is used to validate if a given value is not equal to another value or an array of values.
validate.validators.doesNotEqual = function(value, options, key) {
  const testValue = getTestValue(options);

  if (Array.isArray(testValue)) {
    if (testValue.length === 1) {
      if (testValue[0] === value) {
        return `${key} must not be ${testValue}`;
      }
    } else if (JSON.stringify(testValue) === JSON.stringify(value)) {
      return `${key} must not be equal to ${testValue}`;
    }
  } else if (value === testValue) {
    return `${key} must not be ${testValue}`;
  }
};

validate.validators.includes = function(value, options, key) {
  const testValue = getTestValue(options);
  if (Array.isArray(testValue)) {
    const includedValues = testValue.filter(val => value.includes(val));
    if (includedValues.length === 0) {
      return `${key} must include at least one of the following values: ${value.join(
          ', '
      )}`;
    }
  } else if (!value.includes(testValue)) {
    return `${key} must include ${testValue}`;
  }
};
validate.validators.doesNotInclude = function(value, options, key) {
  const testValue = getTestValue(options);
  if (Array.isArray(testValue)) {
    const includedValues = testValue.filter(val => value.includes(val));
    if (includedValues.length > 0) {
      return `${key} must not include the following value: ${includedValues}`;
    }
  } else if (value.includes(testValue)) {
    return `${key} must not include ${testValue}`;
  }
};
// Ignore case contains.
// options testValue MUST be in lower case already, otherwise it won't match
validate.validators.containsI = function(value, options, key) {
  const testValue = getTestValue(options);
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
            subTest =>
                !validate.validators.containsI(value, subTest.toLowerCase(), key)
        )
    ) {
      return;
    }
    return `${key} must contain at least one of ${testValue.join(',')}`;
  }
  if (
      testValue &&
      value.indexOf &&
      value.toLowerCase().indexOf(testValue.toLowerCase()) === -1
  ) {
    return key + 'must contain any case of' + testValue;
  }
};

validate.validators.contains = function(value, options, key) {
  const testValue = getTestValue(options);
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
  const containsResult = validate.validators.contains(value, options, key);
  if (!containsResult) {
    return `No item of ${value} should contain ${getTestValue(options)}`;
  }
};
validate.validators.doesNotContainI = function(value, options, key) {
  const containsResult = validate.validators.containsI(value, options, key);
  if (!containsResult) {
    return `No item of ${value} should not contain ${getTestValue(options)}`;
  }
};

validate.validators.startsWith = function(value, options, key) {
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
validate.validators.endsWith = function(value, options, key) {
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

validate.validators.greaterThan = function(value, options, key) {
  const testValue = getTestValue(options);
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
validate.validators.lessThan = function(value, options, key) {
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

validate.validators.range = function(value, options, key) {
  const testValue = getTestValue(options);
  if (Array.isArray(testValue) && testValue.length === 2) {
    const min = Math.min(testValue[0], testValue[1]);
    const max = Math.max(testValue[0], testValue[1]);
    if (value === undefined || value < min || value > max) {
      return `${key} with value ${value} must be between ${min} and ${max}`;
    }
  } else return `${key} must be an array of length 2`;
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
export default validate;
