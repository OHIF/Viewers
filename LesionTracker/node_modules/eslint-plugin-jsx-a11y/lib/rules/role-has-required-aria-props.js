'use strict';

var _jsxAstUtils = require('jsx-ast-utils');

var _role = require('../util/attributes/role.json');

var _role2 = _interopRequireDefault(_role);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @fileoverview Enforce that elements with ARIA roles must
 *  have all required attributes for that role.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

var errorMessage = function errorMessage(role, requiredProps) {
  return 'Elements with the ARIA role "' + role + '" must have the following ' + ('attributes defined: ' + String(requiredProps).toLowerCase());
};

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
        // If value is null, then getLiteralAttributeValue is telling us
        // that the value isn't in the form of a literal.
        if (value === undefined || value === null) {
          return;
        }

        var normalizedValues = String(value).toUpperCase().split(' ');
        var validRoles = normalizedValues.filter(function (val) {
          return Object.keys(_role2.default).indexOf(val) > -1;
        });

        validRoles.forEach(function (role) {
          var requiredProps = _role2.default[role].requiredProps;


          if (requiredProps.length > 0) {
            var hasRequiredProps = requiredProps.every(function (prop) {
              return (0, _jsxAstUtils.getProp)(attribute.parent.attributes, prop);
            });

            if (hasRequiredProps === false) {
              context.report({
                node: attribute,
                message: errorMessage(role.toLowerCase(), requiredProps)
              });
            }
          }
        });
      }
    };
  }
};