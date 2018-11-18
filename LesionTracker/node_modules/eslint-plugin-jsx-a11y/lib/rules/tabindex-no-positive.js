'use strict';

var _jsxAstUtils = require('jsx-ast-utils');

var errorMessage = 'Avoid positive integer values for tabIndex.'; /**
                                                                   * @fileoverview Enforce tabIndex value is not greater than zero.
                                                                   * @author Ethan Cohen
                                                                   */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

module.exports = {
  meta: {
    docs: {},

    schema: [{ type: 'object' }]
  },

  create: function create(context) {
    return {
      JSXAttribute: function JSXAttribute(attribute) {
        var name = (0, _jsxAstUtils.propName)(attribute);
        var normalizedName = name ? name.toUpperCase() : '';

        // Check if tabIndex is the attribute
        if (normalizedName !== 'TABINDEX') {
          return;
        }

        // Only check literals because we can't infer values from certain expressions.
        var value = Number((0, _jsxAstUtils.getLiteralPropValue)(attribute));

        if (isNaN(value) || value <= 0) {
          return;
        }

        context.report({
          node: attribute,
          message: errorMessage
        });
      }
    };
  }
};