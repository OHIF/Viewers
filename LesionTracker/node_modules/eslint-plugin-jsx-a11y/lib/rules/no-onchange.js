'use strict';

var _jsxAstUtils = require('jsx-ast-utils');

var errorMessage = 'onBlur must be used instead of onchange, ' + 'unless absolutely necessary and it causes no negative consequences ' + 'for keyboard only or screen reader users.'; /**
                                                                                                                                                                                       * @fileoverview Enforce usage of onBlur over onChange for accessibility.
                                                                                                                                                                                       * @author Ethan Cohen
                                                                                                                                                                                       */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

var applicableTypes = ['select', 'option'];

module.exports = {
  meta: {
    docs: {},

    schema: [{ type: 'object' }]
  },

  create: function create(context) {
    return {
      JSXOpeningElement: function JSXOpeningElement(node) {
        var nodeType = (0, _jsxAstUtils.elementType)(node);

        if (applicableTypes.indexOf(nodeType) === -1) {
          return;
        }

        var onChange = (0, _jsxAstUtils.getProp)(node.attributes, 'onChange');
        var hasOnBlur = (0, _jsxAstUtils.getProp)(node.attributes, 'onBlur') !== undefined;

        if (onChange && !hasOnBlur) {
          context.report({
            node: node,
            message: errorMessage
          });
        }
      }
    };
  }
};