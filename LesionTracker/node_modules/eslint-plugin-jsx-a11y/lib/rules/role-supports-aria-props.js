'use strict';

var _jsxAstUtils = require('jsx-ast-utils');

var _role = require('../util/attributes/role.json');

var _role2 = _interopRequireDefault(_role);

var _ARIA = require('../util/attributes/ARIA.json');

var _ARIA2 = _interopRequireDefault(_ARIA);

var _getImplicitRole = require('../util/getImplicitRole');

var _getImplicitRole2 = _interopRequireDefault(_getImplicitRole);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @fileoverview Enforce that elements with explicit or implicit roles defined contain only
 * `aria-*` properties supported by that `role`.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

var errorMessage = function errorMessage(attr, role, tag, isImplicit) {
  if (isImplicit) {
    return 'The attribute ' + attr + ' is not supported by the role ' + role + '. This role is implicit on the element ' + tag + '.';
  }

  return 'The attribute ' + attr + ' is not supported by the role ' + role + '.';
};

module.exports = {
  meta: {
    docs: {},

    schema: [{ type: 'object' }]
  },

  create: function create(context) {
    return {
      JSXOpeningElement: function JSXOpeningElement(node) {
        // If role is not explicitly defined, then try and get its implicit role.
        var type = (0, _jsxAstUtils.elementType)(node);
        var role = (0, _jsxAstUtils.getProp)(node.attributes, 'role');
        var roleValue = role ? (0, _jsxAstUtils.getLiteralPropValue)(role) : (0, _getImplicitRole2.default)(type, node.attributes);
        var isImplicit = roleValue && role === undefined;

        // If there is no explicit or implicit role, then assume that the element
        // can handle the global set of aria-* properties.
        // This actually isn't true - should fix in future release.
        if (typeof roleValue !== 'string' || _role2.default[roleValue.toUpperCase()] === undefined) {
          return;
        }

        // Make sure it has no aria-* properties defined outside of its property set.
        var propertySet = _role2.default[roleValue.toUpperCase()].props;
        var invalidAriaPropsForRole = Object.keys(_ARIA2.default).filter(function (attribute) {
          return propertySet.indexOf(attribute) === -1;
        });

        node.attributes.forEach(function (prop) {
          if (prop.type === 'JSXSpreadAttribute') {
            return;
          }

          var name = (0, _jsxAstUtils.propName)(prop);
          var normalizedName = name ? name.toUpperCase() : '';

          if (invalidAriaPropsForRole.indexOf(normalizedName) > -1) {
            context.report({
              node: node,
              message: errorMessage(name, roleValue, type, isImplicit)
            });
          }
        });
      }
    };
  }
};