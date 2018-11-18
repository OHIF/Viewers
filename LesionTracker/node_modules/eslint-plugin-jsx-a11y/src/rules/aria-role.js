/**
 * @fileoverview Enforce aria role attribute is valid.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { getLiteralPropValue, propName } from 'jsx-ast-utils';
import roles from '../util/attributes/role.json';

const errorMessage = 'Elements with ARIA roles must use a valid, non-abstract ARIA role.';

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

      if (normalizedName !== 'ROLE') {
        return;
      }

      const value = getLiteralPropValue(attribute);

      // If value is undefined, then the role attribute will be dropped in the DOM.
      // If value is null, then getLiteralAttributeValue is telling us that the
      // value isn't in the form of a literal.
      if (value === undefined || value === null) {
        return;
      }

      const normalizedValues = String(value).toUpperCase().split(' ');
      const validRoles = Object.keys(roles).filter(role => roles[role].abstract === false);
      const isValid = normalizedValues.every(val => validRoles.indexOf(val) > -1);

      if (isValid === true) {
        return;
      }

      context.report({
        node: attribute,
        message: errorMessage,
      });
    },
  }),
};
