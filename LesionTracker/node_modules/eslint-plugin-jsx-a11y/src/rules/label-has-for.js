/**
 * @fileoverview Enforce label tags have htmlFor attribute.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { getProp, getPropValue, elementType } from 'jsx-ast-utils';

const errorMessage = 'Form controls using a label to identify them must be ' +
  'programmatically associated with the control using htmlFor';

module.exports = {
  meta: {
    docs: {},

    schema: [
      {
        oneOf: [
          { type: 'string' },
          {
            type: 'array',
            items: {
              type: 'string',
            },
            minItems: 1,
            uniqueItems: true,
          },
        ],
      },
    ],
  },

  create: context => ({
    JSXOpeningElement: (node) => {
      const typeCheck = ['label'].concat(context.options[0]);
      const nodeType = elementType(node);

      // Only check 'label' elements and custom types.
      if (typeCheck.indexOf(nodeType) === -1) {
        return;
      }

      const htmlForAttr = getProp(node.attributes, 'htmlFor');
      const htmlForValue = getPropValue(htmlForAttr);
      const isInvalid = htmlForAttr === false || !htmlForValue;

      if (isInvalid) {
        context.report({
          node,
          message: errorMessage,
        });
      }
    },
  }),
};
