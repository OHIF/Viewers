'use strict';

var _jsxAstUtils = require('jsx-ast-utils');

var _DOM = require('../util/attributes/DOM.json');

var _DOM2 = _interopRequireDefault(_DOM);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @fileoverview Enforce scope prop is only used on <th> elements.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

var errorMessage = 'The scope prop can only be used on <th> elements.';

module.exports = {
  meta: {
    docs: {},

    schema: [{ type: 'object' }]
  },

  create: function create(context) {
    return {
      JSXAttribute: function JSXAttribute(node) {
        var name = (0, _jsxAstUtils.propName)(node);
        if (name && name.toUpperCase() !== 'SCOPE') {
          return;
        }

        var parent = node.parent;

        var tagName = (0, _jsxAstUtils.elementType)(parent);

        // Do not test higher level JSX components, as we do not know what
        // low-level DOM element this maps to.
        if (Object.keys(_DOM2.default).indexOf(tagName) === -1) {
          return;
        } else if (tagName && tagName.toUpperCase() === 'TH') {
          return;
        }

        context.report({
          node: node,
          message: errorMessage
        });
      }
    };
  }
};