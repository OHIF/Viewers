'use strict';

var _jsxAstUtils = require('jsx-ast-utils');

var _isHiddenFromScreenReader = require('../util/isHiddenFromScreenReader');

var _isHiddenFromScreenReader2 = _interopRequireDefault(_isHiddenFromScreenReader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @fileoverview Enforce anchor elements to contain accessible content.
 * @author Lisa Ring & Niklas Holmberg
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

var errorMessage = 'Anchors must have content and the content must be accessible by a screen reader.';

var anchors = ['a', 'Link'];

module.exports = {
  meta: {
    docs: {},

    schema: [{
      oneOf: [{ type: 'string' }, {
        type: 'array',
        items: {
          type: 'string'
        },
        minItems: 1,
        uniqueItems: true
      }]
    }]
  },

  create: function create(context) {
    return {
      JSXOpeningElement: function JSXOpeningElement(node) {
        var typeCheck = anchors.concat(context.options[0]);
        var nodeType = (0, _jsxAstUtils.elementType)(node);

        // Only check anchor elements and custom types.
        if (typeCheck.indexOf(nodeType) === -1) {
          return;
        }
        var isAccessible = node.parent.children.some(function (child) {
          switch (child.type) {
            case 'Literal':
              return Boolean(child.value);
            case 'JSXElement':
              return !(0, _isHiddenFromScreenReader2.default)((0, _jsxAstUtils.elementType)(child.openingElement), child.openingElement.attributes);
            case 'JSXExpressionContainer':
              if (child.expression.type === 'Identifier') {
                return child.expression.name !== 'undefined';
              }
              return true;
            default:
              return false;
          }
        }) || (0, _jsxAstUtils.hasAnyProp)(node.attributes, ['dangerouslySetInnerHTML', 'children']);

        if (isAccessible) {
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