'use strict';

var _jsxAstUtils = require('jsx-ast-utils');

var _ARIA = require('../util/attributes/ARIA.json');

var _ARIA2 = _interopRequireDefault(_ARIA);

var _getSuggestion = require('../util/getSuggestion');

var _getSuggestion2 = _interopRequireDefault(_getSuggestion);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errorMessage = function errorMessage(name) {
  var dictionary = Object.keys(_ARIA2.default).map(function (aria) {
    return aria.toLowerCase();
  });
  var suggestions = (0, _getSuggestion2.default)(name, dictionary);
  var message = name + ': This attribute is an invalid ARIA attribute.';

  if (suggestions.length > 0) {
    return message + ' Did you mean to use ' + suggestions + '?';
  }

  return message;
}; /**
    * @fileoverview Enforce all aria-* properties are valid.
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

        // `aria` needs to be prefix of property.
        if (normalizedName.indexOf('ARIA-') !== 0) {
          return;
        }

        var isValid = Object.keys(_ARIA2.default).indexOf(normalizedName) > -1;

        if (isValid === false) {
          context.report({
            node: attribute,
            message: errorMessage(name)
          });
        }
      }
    };
  }
};