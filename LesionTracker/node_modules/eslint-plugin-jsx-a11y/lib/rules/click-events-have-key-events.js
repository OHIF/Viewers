'use strict';

var _jsxAstUtils = require('jsx-ast-utils');

var _isHiddenFromScreenReader = require('../util/isHiddenFromScreenReader');

var _isHiddenFromScreenReader2 = _interopRequireDefault(_isHiddenFromScreenReader);

var _isInteractiveElement = require('../util/isInteractiveElement');

var _isInteractiveElement2 = _interopRequireDefault(_isInteractiveElement);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errorMessage = 'Visible, non-interactive elements with click handlers' + ' must have at least one keyboard listener.'; /**
                                                                                                                            * @fileoverview Enforce a clickable non-interactive element has at least 1 keyboard event listener.
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
      JSXOpeningElement: function JSXOpeningElement(node) {
        var props = node.attributes;
        if ((0, _jsxAstUtils.getProp)(props, 'onclick') === undefined) {
          return;
        }

        var type = (0, _jsxAstUtils.elementType)(node);
        var requiredProps = ['onkeydown', 'onkeyup', 'onkeypress'];

        if ((0, _isHiddenFromScreenReader2.default)(type, props)) {
          return;
        } else if ((0, _isInteractiveElement2.default)(type, props)) {
          return;
        } else if ((0, _jsxAstUtils.hasAnyProp)(props, requiredProps)) {
          return;
        }

        // Visible, non-interactive elements with click handlers require one keyboard event listener.
        context.report({
          node: node,
          message: errorMessage
        });
      }
    };
  }
};