'use strict';

var _jsxAstUtils = require('jsx-ast-utils');

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
        var typeCheck = ['img'].concat(context.options[0]);
        var nodeType = (0, _jsxAstUtils.elementType)(node);

        // Only check 'img' elements and custom types.
        if (typeCheck.indexOf(nodeType) === -1) {
          return;
        }

        var roleProp = (0, _jsxAstUtils.getProp)(node.attributes, 'role');
        var roleValue = (0, _jsxAstUtils.getPropValue)(roleProp);
        var isPresentation = roleProp && typeof roleValue === 'string' && roleValue.toLowerCase() === 'presentation';

        if (isPresentation) {
          return;
        }

        var altProp = (0, _jsxAstUtils.getProp)(node.attributes, 'alt');

        // Missing alt prop error.
        if (altProp === undefined) {
          context.report({
            node: node,
            message: nodeType + ' elements must have an alt prop or use role="presentation".'
          });
          return;
        }

        // Check if alt prop is undefined.
        var altValue = (0, _jsxAstUtils.getPropValue)(altProp);
        var isNullValued = altProp.value === null; // <img alt />

        if (altValue && !isNullValued || altValue === '') {
          return;
        }

        // Undefined alt prop error.
        context.report({
          node: node,
          message: 'Invalid alt value for ' + nodeType + '. Use alt="" or role="presentation" for presentational images.'
        });
      }
    };
  }
}; /**
    * @fileoverview Enforce img tag uses alt attribute.
    * @author Ethan Cohen
    */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------