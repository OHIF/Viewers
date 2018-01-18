import {validate as v} from './lib/validate.js';

v.validators.equals = function(value, options, key, attributes) {
    if (options && value !== options.value) {
        return key + 'must equal ' + options.value;
    }
};

v.validators.doesNotEqual = function(value, options, key) {
    if (options && value === options.value) {
        return key + 'cannot equal ' + options.value;
    }
};

v.validators.contains = function(value, options, key) {
    if (options && value.indexOf && value.indexOf(options.value) === -1) {
        return key + 'must contain ' + options.value;
    }
};

v.validators.doesNotContain = function(value, options, key) {
    if (options && value.indexOf && value.indexOf(options.value) !== -1) {
        return key + 'cannot contain ' + options.value;
    }
};

v.validators.startsWith = function(value, options, key) {
    if (options && value.startsWith && !value.startsWith(options.value)) {
        return key + 'must start with ' + options.value;
    }
};

v.validators.endsWith = function(value, options, key) {
    if (options && value.endsWith && !value.endsWith(options.value)) {
        return key + 'must end with ' + options.value;
    }
};

validate = v;