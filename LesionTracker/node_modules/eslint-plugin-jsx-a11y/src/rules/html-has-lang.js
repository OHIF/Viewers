/**
 * @fileoverview Enforce html element has lang prop.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { elementType, getProp, getPropValue } from 'jsx-ast-utils';

const errorMessage = '<html> elements must have the lang prop.';

module.exports = {
  meta: {
    docs: {},

    schema: [
      { type: 'object' },
    ],
  },

  create: context => ({
    JSXOpeningElement: (node) => {
      const type = elementType(node);

      if (type && type !== 'html') {
        return;
      }

      const lang = getPropValue(getProp(node.attributes, 'lang'));

      if (lang) {
        return;
      }

      context.report({
        node,
        message: errorMessage,
      });
    },
  }),
};
