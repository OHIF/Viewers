'use strict';

var _jsxAstUtils = require('jsx-ast-utils');

var errorMessage = 'Form controls using a label to identify them must be ' + 'programmatically associated with the control using htmlFor'; /**
                                                                                                                                            * @fileoverview Enforce label tags have htmlFor attribute.
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
        var typeCheck = ['label'].concat(context.options[0]);
        var nodeType = (0, _jsxAstUtils.elementType)(node);

        // Only check 'label' elements and custom types.
        if (typeCheck.indexOf(nodeType) === -1) {
          return;
        }

        var htmlForAttr = (0, _jsxAstUtils.getProp)(node.attributes, 'htmlFor');
        var htmlForValue = (0, _jsxAstUtils.getPropValue)(htmlForAttr);
        var isInvalid = htmlForAttr === false || !htmlForValue;

        if (isInvalid) {
          context.report({
            node: node,
            message: errorMessage
          });
        }
      }
    };
  }
};