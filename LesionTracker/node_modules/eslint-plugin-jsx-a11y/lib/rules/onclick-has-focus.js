'use strict';

var _jsxAstUtils = require('jsx-ast-utils');

var _isHiddenFromScreenReader = require('../util/isHiddenFromScreenReader');

var _isHiddenFromScreenReader2 = _interopRequireDefault(_isHiddenFromScreenReader);

var _isInteractiveElement = require('../util/isInteractiveElement');

var _isInteractiveElement2 = _interopRequireDefault(_isInteractiveElement);

var _getTabIndex = require('../util/getTabIndex');

var _getTabIndex2 = _interopRequireDefault(_getTabIndex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

/**
 * @fileoverview Enforce that elements with onClick handlers must be focusable.
 * @author Ethan Cohen
 */

var errorMessage = 'Elements with onClick handlers must be focusable. ' + 'Either set the tabIndex property to a valid value (usually 0), or use ' + 'an element type which is inherently focusable such as `button`.';

module.exports = {
  meta: {
    docs: {},

    schema: [{ type: 'object' }]
  },

  create: function create(context) {
    return {
      JSXOpeningElement: function JSXOpeningElement(node) {
        var attributes = node.attributes;

        if ((0, _jsxAstUtils.getProp)(attributes, 'onClick') === undefined) {
          return;
        }

        var type = (0, _jsxAstUtils.elementType)(node);

        if ((0, _isHiddenFromScreenReader2.default)(type, attributes)) {
          return;
        } else if ((0, _isInteractiveElement2.default)(type, attributes)) {
          return;
        } else if ((0, _getTabIndex2.default)((0, _jsxAstUtils.getProp)(attributes, 'tabIndex')) !== undefined) {
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