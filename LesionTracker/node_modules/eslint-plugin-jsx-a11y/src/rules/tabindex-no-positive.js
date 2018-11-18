/**
 * @fileoverview Enforce tabIndex value is not greater than zero.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { getLiteralPropValue, propName } from 'jsx-ast-utils';

const errorMessage = 'Avoid positive integer values for tabIndex.';

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

      // Check if tabIndex is the attribute
      if (normalizedName !== 'TABINDEX') {
        return;
      }

      // Only check literals because we can't infer values from certain expressions.
      const value = Number(getLiteralPropValue(attribute));

      if (isNaN(value) || value <= 0) {
        return;
      }

      context.report({
        node: attribute,
        message: errorMessage,
      });
    },
  }),
};
