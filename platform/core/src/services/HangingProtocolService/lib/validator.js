import validate from 'validate.js';

// The equals function is used to validate if a given value is equal to another value or an array of values.

validate.validators.equals = function(value, options, key) {
  const testValue = getTestValue(options);

  // If options is an array, then we need to validate each element in the array
  if (Array.isArray(testValue)) {
    // If the array has only one element, then we need to compare the value to that element
    if (testValue.length === 1) {
      if (testValue[0] !== value) {
        return `${key} + ' must equal ' + ${value}`;
      }
    } else if (testValue.length !== value.length) {
      return `${key} +  must be an array of length  + ${testValue.length}`;
    }
    // We need to compare each element in the array
    else {
      const missingValues = [];
      for (let i = 0; i < testValue.length; i++) {
        if (!testValue.includes(value[i])) {
          missingValues.push(value[i]);
        }
      }
      // If all elements in the array match the test values, then the validation passes
      if (missingValues.length === 0) {
      }
      // Special case for a single missing value
      else if (missingValues.length === 1) {
        const missingIndex = testValue.findIndex(elem => !value.includes(elem));
        const expectedValue = value[value.indexOf(missingValues[0])];
        return `${key} equals[${missingIndex}] must equal ${expectedValue}`;
      } else {
        // General case for multiple missing values
        const notIncluded = testValue.filter(el => !value.includes(el));
        const missingIndexes = notIncluded.map(el => testValue.indexOf(el));
        return `${key} equals[${missingIndexes}] must equal ${missingValues}`;
      }
    }
  }
  // If options is not an array, we can compare the value directly
  else if (value !== testValue) {
    return key + ' must equal ' + testValue;
  }
};

// The doesNotEqual function is used to validate if a given value is not equal to another value or an array of values.

validate.validators.doesNotEqual = function(value, options, key) {
  const testValue = getTestValue(options);

  if (Array.isArray(testValue)) {
    // If the array has only one element, then we need to compare the value to that element
    if (testValue.length === 1) {
      if (testValue[0] === value) {
        return `${key} must not equal ${value}`;
      }
    } else if (testValue.length !== value.length) {
      return `${key} must be an array of length ${testValue.length}`;
    } else {
      const includedValues = [];
      for (let i = 0; i < testValue.length; i++) {
        if (testValue.includes(value[i])) {
          includedValues.push(value[i]);
        }
      }
      if (includedValues.length === 0) {
      } else if (includedValues.length === 1) {
        let includedIndex = testValue.findIndex(elem => value.includes(elem));
        const unexpectedValue = value[value.indexOf(includedValues[0])];
        return `${key} equals[${includedIndex}] must not equal ${unexpectedValue}`;
      } else {
        const includedIndexes = testValue
            .filter(el => value.includes(el))
            .map(el => testValue.indexOf(el));
        return `${key} equals[${includedIndexes}] must not equal ${includedValues}`;
      }
    }
  }
  // If options is not an array, we can compare the value directly
  else if (value === testValue) {
    return key + ' must not equal ' + testValue;
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
  const testValues = getTestValue(options);
  if (Array.isArray(testValues)) {
    let matchFound = false;
    testValues.forEach(testValue => {
      if (value.indexOf(testValue) !== -1) {
        matchFound = true;
      }
    });
    if (matchFound) {
      return key + ' cannot contain any of ' + testValues.join(',');
    }
  } else {
    if (value.indexOf(testValues) !== -1) {
      return key + ' cannot contain ' + testValues;
    }
  }
};

validate.validators.startsWith = function(value, options, key) {
  const testValues = getTestValue(options);
  if (Array.isArray(testValues)) {
    if (testValues.length === 1) {
      if (!value.startsWith(testValues[0])) {
        return key + ' must start with ' + testValues;
      }
    } else return `${key} startsWith must be an array of length 1`;
  } else {
    if (!value.startsWith(testValues)) {
      return key + ' start end with ' + testValues;
    }
  }
};

validate.validators.endsWith = function(value, options, key) {
  const testValues = getTestValue(options);
  if (Array.isArray(testValues)) {
    if (testValues.length === 1) {
      if (!value.endsWith(testValues[0])) {
        return key + ' must end with ' + testValues;
      }
    } else return `${key} must be an array of length 1`;
  } else {
    if (!value.endsWith(testValues)) {
      return key + ' must end with ' + testValues;
    }
  }
};

const getTestValue = options => {
  if (Array.isArray(options)) {
    return options.map(option => option?.value ?? option);
  } else {
    return options?.value ?? options;
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
    if (!(value > testValue)) {
      return key + ' must be greater than ' + testValue;
    }
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
