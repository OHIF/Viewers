/**
 * @fileoverview Enforce ARIA state and property values are valid.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { getLiteralPropValue, propName } from 'jsx-ast-utils';
import ariaAttributes from '../util/attributes/ARIA.json';

const errorMessage = (name, type, permittedValues) => {
  switch (type) {
    case 'tristate':
      return `The value for ${name} must be a boolean or the string "mixed".`;
    case 'token':
      return `The value for ${name} must be a single token from the following: ${permittedValues}.`;
    case 'tokenlist':
      return `The value for ${name} must be a list of one or more \
tokens from the following: ${permittedValues}.`;
    case 'boolean':
    case 'string':
    case 'integer':
    case 'number':
    default:
      return `The value for ${name} must be a ${type}.`;
  }
};

const validityCheck = (value, expectedType, permittedValues) => {
  switch (expectedType) {
    case 'boolean':
      return typeof value === 'boolean';
    case 'string':
      return typeof value === 'string';
    case 'tristate':
      return typeof value === 'boolean' || value === 'mixed';
    case 'integer':
    case 'number':
      // Booleans resolve to 0/1 values so hard check that it's not first.
      return typeof value !== 'boolean' && isNaN(Number(value)) === false;
    case 'token':
      return typeof value === 'string' && permittedValues.indexOf(value.toLowerCase()) > -1;
    case 'tokenlist':
      return typeof value === 'string' &&
        value.split(' ').every(token => permittedValues.indexOf(token.toLowerCase()) > -1);
    default:
      return false;
  }
};

module.exports = {
  meta: {
    docs: {},

    schema: [
      { type: 'object' },
    ],
  },

  create: context => ({
    JSXAttribute: (attribute) => {
      const name = propName(attribute);
      const normalizedName = name ? name.toUpperCase() : '';

      // Not a valid aria-* state or property.
      if (normalizedName.indexOf('ARIA-') !== 0 || ariaAttributes[normalizedName] === undefined) {
        return;
      }

      const value = getLiteralPropValue(attribute);

      // We only want to check literal prop values, so just pass if it's null.
      if (value === null) {
        return;
      }

      // These are the attributes of the property/state to check against.
      const attributes = ariaAttributes[normalizedName];
      const permittedType = attributes.type;
      const allowUndefined = attributes.allowUndefined || false;
      const permittedValues = attributes.values || [];

      const isValid = validityCheck(value, permittedType, permittedValues) ||
        (allowUndefined && value === undefined);

      if (isValid) {
        return;
      }

      context.report({
        node: attribute,
        message: errorMessage(name, permittedType, permittedValues),
      });
    },
  }),
};
