/**
 * @fileoverview Enforce <marquee> elements are not used.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { elementType } from 'jsx-ast-utils';

const errorMessage =
  'Do not use <marquee> elements as they create accessibility issues and are deprecated.';

module.exports = {
  meta: {
    docs: {},

    schema: [
      { type: 'object' },
    ],
  },

  create: context => ({
    JSXOpeningElement: (node) => {
      const isMarquee = elementType(node) === 'marquee';

      if (isMarquee) {
        context.report({
          node,
          message: errorMessage,
        });
      }
    },
  }),
};
