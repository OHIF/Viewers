import validate from 'validate.js';
import { asArray } from '@cornerstonejs/utils';

/** The validators that this module adds to validate.js. */
export const OHIF_VALIDATORS = new Set([
  'equals',
  'doesNotEqual',
  'includes',
  'doesNotInclude',
  'containsI',
  'contains',
  'containsAll',
  'doesNotContain',
  'doesNotContainI',
  'startsWith',
  'endsWith',
  'greaterThan',
  'greaterThanOrEqual',
  'lessThan',
  'lessThanOrEqual',
  'range',
  'notNull',
]);

/**
 * True for an OHIF validator. Each one reads its operand as a value to test, so
 * `false` or `0` is a test value. For a validate.js built-in such as
 * `presence`, or a validator that an application adds, `false` keeps the
 * validate.js meaning.
 */
export const isOhifValidator = name => OHIF_VALIDATORS.has(name);

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
    return `${key} must equal ${showValue(testValue)}`;
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
 * testValue = 'Attenuation Corrected' (Fail)
 *           = 'Attenuation' (Valid)
 *
 * value = ['Attenuation Corrected']
 * testValue = ['Attenuation Corrected'] (Fail)
 *           = 'Attenuation Corrected' (Fail)
 *           = 'Attenuation' (Valid)
 * */
validate.validators.doesNotEqual = function (value, options, key) {
  const testValue = getTestValue(options);
  if (isEqualToTestValue(value, testValue)) {
    return `${key} must not equal ${showValue(testValue)}`;
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
    return `${key} must include one of ${showValue(testValue)}`;
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
    return `${key} must not include ${showValue(includedValues)}`;
  }
};
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
  if (!matchesText(value, options, true, (text, needle) => text.includes(needle))) {
    return `${key} must contain any case of one of ${showValue(getTestValue(options))}`;
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
  if (!matchesText(value, options, false, (text, needle) => text.includes(needle))) {
    return `${key} must contain one of ${showValue(getTestValue(options))}`;
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
  if (matchesText(value, options, false, (text, needle) => text.includes(needle))) {
    return `${key} must not contain ${showValue(getTestValue(options))}`;
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
  if (matchesText(value, options, true, (text, needle) => text.includes(needle))) {
    return `${key} must not contain any case of ${showValue(getTestValue(options))}`;
  }
};
/**
 * @example
 * value = 'Attenuation Corrected'
 * testValue = ‘Corr’ (Fail)
 *           = ‘Att’ (Valid)
 *           = ['cat', 'dog', 'Att'] (Valid)
 *           = [‘cat’, ‘dog’] (Fail)
 *
 * value = ['abc', 'def', 'GHI']
 * testValue = 'de' (Valid)
 *           = 'deg' (Fail)
 *           = ['cat', 'GH']  (Valid)
 *           = ['cat', 'gh'] (Fail)
 *           = ['cat', 'dog'] (Fail)
 *
 * */
validate.validators.startsWith = function (value, options, key) {
  if (!matchesText(value, options, false, (text, needle) => text.startsWith(needle))) {
    return `${key} must start with one of ${showValue(getTestValue(options))}`;
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
 * testValue = 'ef' (Valid)
 *           = 'deg' (Fail)
 *           = ['cat', 'HI']  (Valid)
 *           = ['cat', 'hi'] (Fail)
 *           = ['cat', 'dog'] (Fail)
 *
 * */
validate.validators.endsWith = function (value, options, key) {
  if (!matchesText(value, options, false, (text, needle) => text.endsWith(needle))) {
    return `${key} must end with one of ${showValue(getTestValue(options))}`;
  }
};
/**
 * Creates a validator that compares a numeric value with one test value. The
 * test value can be a number, `{ value }`, or an array of one number.
 *
 * The value reads as in `@cornerstonejs/metadata`: a number, a numeric string,
 * or the first element of an array. A value with no number fails. The test
 * value reads in the same way, and a test value with no number (`''`, `[]`,
 * `null`) fails. `@cornerstonejs/metadata` accepts a finite number only.
 *
 * @param compare - the comparison of the value with the test value
 * @param relation - the relation, for the error message
 */
const createNumberValidator = (compare, relation) =>
  function (rawValue, options, key) {
    const value = toFinite(Array.isArray(rawValue) ? rawValue[0] : rawValue);
    if (value === undefined) {
      return `${key} must be a number, but was ${showValue(rawValue)}`;
    }
    const rawTestValue = getTestValue(options);
    if (Array.isArray(rawTestValue) && rawTestValue.length > 1) {
      return key + ' must be an array of length 1';
    }
    const testValue = toFinite(Array.isArray(rawTestValue) ? rawTestValue[0] : rawTestValue);
    if (testValue === undefined) {
      return `${key} has a test value that is not a number: ${showValue(rawTestValue)}`;
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
validate.validators.greaterThan = createNumberValidator((a, b) => a > b, 'greater than');
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
  'greater than or equal to'
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
validate.validators.lessThan = createNumberValidator((a, b) => a < b, 'less than');
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
  'less than or equal to'
);
/**
 * @example
 * value = 50
 * testValue = [10,60] (Valid)
 *           = [60, 10] (Valid)
 *           = [0, 10] (Fail)
 *           = [70, 80] (Fail)
 *           = 45  (Fail)
 *           = [45] (Fail)
 *
 * */
validate.validators.range = function (rawValue, options, key) {
  const testValue = getTestValue(options);
  const bounds = Array.isArray(testValue) ? testValue.map(toFinite) : [];
  if (bounds.length !== 2 || bounds.includes(undefined)) {
    return `${key} must be an array of two numbers`;
  }
  const min = Math.min(bounds[0], bounds[1]);
  const max = Math.max(bounds[0], bounds[1]);
  // The value reads as in the number validators: the first element of an array.
  const value = toFinite(Array.isArray(rawValue) ? rawValue[0] : rawValue);
  if (value === undefined || value < min || value > max) {
    return `${key} with value ${showValue(rawValue)} must be between ${min} and ${max}`;
  }
};

/**
 * No value, as in `@cornerstonejs/metadata` `hasNoValue`: `undefined`, `null`,
 * `''`, or an array whose elements all have no value (`[]`, `['']`, `[null]`).
 */
const hasNoValue = value =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.every(hasNoValue));

/** `notNull: true` fails on no value, and `notNull: false` fails on a value. */
validate.validators.notNull = (value, options) => {
  const isNull = hasNoValue(value);
  if (getTestValue(options) === false) {
    return isNull ? undefined : 'Value is not null';
  }
  return isNull ? 'Value is null' : undefined;
};
/** The operand, without its `{ value }` wrapper. `{ value: null }` gives `null`. */
const unwrap = option =>
  option !== null && typeof option === 'object' && !Array.isArray(option) && 'value' in option
    ? option.value
    : option;
const getTestValue = options => (Array.isArray(options) ? options.map(unwrap) : unwrap(options));
/**
 * The test values of a text validator as text: `0` is `'0'`. A `null` or
 * `undefined` test value gives no text, so it matches nothing.
 * `@cornerstonejs/metadata` accepts a string operand only.
 */
const toTexts = testValue =>
  asArray(testValue)
    .filter(text => text !== null && text !== undefined)
    .map(String);
/** A value for an error message: a number as is, other values as JSON. */
const showValue = value =>
  typeof value === 'number' ? String(value) : (JSON.stringify(value) ?? String(value));
/**
 * True when a text of the value and a test value pass `test`, as the text
 * operators of `@cornerstonejs/metadata` do. The value reads as text: each
 * element of an array that has a value, so `5` is `'5'`. A value with no value
 * gives no text, so `contains` fails and `doesNotContain` holds.
 */
const matchesText = (value, options, ignoreCase, test) => {
  const toCase = text => (ignoreCase ? text.toLowerCase() : text);
  const texts = (Array.isArray(value) ? value : [value])
    .filter(element => !hasNoValue(element))
    .map(element => toCase(String(element)));
  const needles = toTexts(getTestValue(options)).map(toCase);
  return texts.some(text => needles.some(needle => test(text, needle)));
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
 * or, when one value is a number, equal numbers, so `'1'` equals `1`. A
 * boolean equals the number `1` / `0` and the text `'true'` / `'false'` only.
 */
const isEqualElement = (a, b) => {
  if (a === b) {
    return true;
  }
  if (typeof a === 'boolean' || typeof b === 'boolean') {
    const [flag, other] = typeof a === 'boolean' ? [a, b] : [b, a];
    return other === (flag ? 1 : 0) || other === String(flag);
  }
  if (typeof a !== 'number' && typeof b !== 'number') {
    return false;
  }
  const x = toFinite(a);
  return x !== undefined && x === toFinite(b);
};
/** The test values that the value holds, with {@link isEqualElement}. */
const includedTestValues = (value, testValue) => {
  const values = asArray(value);
  return asArray(testValue).filter(item => values.some(element => isEqualElement(element, item)));
};
/**
 * The equality of `equals` and `doesNotEqual`. A single value is the same as an
 * array of one value, so `'abc'` equals `['abc']`, but not `['abc', 'def']`.
 * Two arrays are equal when they have the same length and the same elements,
 * in the same order. Use `includes` to test that a value is one of a list.
 */
const isEqualToTestValue = (value, testValue) => {
  const values = asArray(value);
  const testValues = asArray(testValue);
  return (
    values.length === testValues.length &&
    testValues.every((item, index) => isEqualElement(item, values[index]))
  );
};
export default validate;
