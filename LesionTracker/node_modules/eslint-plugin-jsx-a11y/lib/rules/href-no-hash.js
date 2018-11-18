'use strict';

var _jsxAstUtils = require('jsx-ast-utils');

var errorMessage = 'Links must not point to "#". ' + 'Use a more descriptive href or use a button instead.'; /**
                                                                                                              * @fileoverview Enforce links may not point to just #.
                                                                                                              * @author Ethan Cohen
                                                                                                              */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

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
        var typeCheck = ['a'].concat(context.options[0]);
        var nodeType = (0, _jsxAstUtils.elementType)(node);

        // Only check 'a' elements and custom types.
        if (typeCheck.indexOf(nodeType) === -1) {
          return;
        }

        var href = (0, _jsxAstUtils.getProp)(node.attributes, 'href');
        var value = (0, _jsxAstUtils.getPropValue)(href);

        if (href && value === '#') {
          context.report({
            node: node,
            message: errorMessage
          });
        }
      }
    };
  }
};