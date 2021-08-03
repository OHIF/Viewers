import validate from 'validate.js';

validate.validators.equals = function(value, options, key, attributes) {
  if (options && value !== options.value) {
    return key + 'must equal ' + options.value;
  }
};

validate.validators.doesNotEqual = function(value, options, key) {
  if (options && value === options.value) {
    return key + 'cannot equal ' + options.value;
  }
};

validate.validators.contains = function(value, options, key) {
  if (options && value.indexOf && value.indexOf(options.value) === -1) {
    return key + 'must contain ' + options.value;
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

export { validate };
