/**
 * @fileoverview Enforce links may not point to just #.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { getProp, getPropValue, elementType } from 'jsx-ast-utils';

const errorMessage = 'Links must not point to "#". ' +
  'Use a more descriptive href or use a button instead.';

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
      const typeCheck = ['a'].concat(context.options[0]);
      const nodeType = elementType(node);

      // Only check 'a' elements and custom types.
      if (typeCheck.indexOf(nodeType) === -1) {
        return;
      }

      const href = getProp(node.attributes, 'href');
      const value = getPropValue(href);

      if (href && value === '#') {
        context.report({
          node,
          message: errorMessage,
        });
      }
    },
  }),
};
