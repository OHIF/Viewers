'use strict';

var _jsxAstUtils = require('jsx-ast-utils');

var mouseOverErrorMessage = 'onMouseOver must be accompanied by onFocus for accessibility.'; /**
                                                                                              * @fileoverview Enforce onmouseover/onmouseout are
                                                                                              *  accompanied by onfocus/onblur.
                                                                                              * @author Ethan Cohen
                                                                                              */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

var mouseOutErrorMessage = 'onMouseOut must be accompanied by onBlur for accessibility.';

module.exports = {
  meta: {
    docs: {},

    schema: [{ type: 'object' }]
  },

  create: function create(context) {
    return {
      JSXOpeningElement: function JSXOpeningElement(node) {
        var attributes = node.attributes;

        // Check onmouseover / onfocus pairing.
        var onMouseOver = (0, _jsxAstUtils.getProp)(attributes, 'onMouseOver');
        var onMouseOverValue = (0, _jsxAstUtils.getPropValue)(onMouseOver);

        if (onMouseOver && (onMouseOverValue !== null || onMouseOverValue !== undefined)) {
          var hasOnFocus = (0, _jsxAstUtils.getProp)(attributes, 'onFocus');
          var onFocusValue = (0, _jsxAstUtils.getPropValue)(hasOnFocus);

          if (hasOnFocus === false || onFocusValue === null || onFocusValue === undefined) {
            context.report({
              node: node,
              message: mouseOverErrorMessage
            });
          }
        }

        // Checkout onmouseout / onblur pairing
        var onMouseOut = (0, _jsxAstUtils.getProp)(attributes, 'onMouseOut');
        var onMouseOutValue = (0, _jsxAstUtils.getPropValue)(onMouseOut);
        if (onMouseOut && (onMouseOutValue !== null || onMouseOutValue !== undefined)) {
          var hasOnBlur = (0, _jsxAstUtils.getProp)(attributes, 'onBlur');
          var onBlurValue = (0, _jsxAstUtils.getPropValue)(hasOnBlur);

          if (hasOnBlur === false || onBlurValue === null || onBlurValue === undefined) {
            context.report({
              node: node,
              message: mouseOutErrorMessage
            });
          }
        }
      }
    };
  }
};