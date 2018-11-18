'use strict';

var _jsxAstUtils = require('jsx-ast-utils');

var _role = require('../util/attributes/role.json');

var _role2 = _interopRequireDefault(_role);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @fileoverview Enforce aria role attribute is valid.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

var errorMessage = 'Elements with ARIA roles must use a valid, non-abstract ARIA role.';

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

        if (normalizedName !== 'ROLE') {
          return;
        }

        var value = (0, _jsxAstUtils.getLiteralPropValue)(attribute);

        // If value is undefined, then the role attribute will be dropped in the DOM.
        // If value is null, then getLiteralAttributeValue is telling us that the
        // value isn't in the form of a literal.
        if (value === undefined || value === null) {
          return;
        }

        var normalizedValues = String(value).toUpperCase().split(' ');
        var validRoles = Object.keys(_role2.default).filter(function (role) {
          return _role2.default[role].abstract === false;
        });
        var isValid = normalizedValues.every(function (val) {
          return validRoles.indexOf(val) > -1;
        });

        if (isValid === true) {
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