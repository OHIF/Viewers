/**
 * @fileoverview Enforce a clickable non-interactive element has at least 1 keyboard event listener.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { getProp, hasAnyProp, elementType } from 'jsx-ast-utils';
import isHiddenFromScreenReader from '../util/isHiddenFromScreenReader';
import isInteractiveElement from '../util/isInteractiveElement';

const errorMessage = 'Visible, non-interactive elements with click handlers' +
' must have at least one keyboard listener.';

module.exports = {
  meta: {
    docs: {},

    schema: [
      { type: 'object' },
    ],
  },

  create: context => ({
    JSXOpeningElement: (node) => {
      const props = node.attributes;
      if (getProp(props, 'onclick') === undefined) {
        return;
      }

      const type = elementType(node);
      const requiredProps = ['onkeydown', 'onkeyup', 'onkeypress'];

      if (isHiddenFromScreenReader(type, props)) {
        return;
      } else if (isInteractiveElement(type, props)) {
        return;
      } else if (hasAnyProp(props, requiredProps)) {
        return;
      }

      // Visible, non-interactive elements with click handlers require one keyboard event listener.
      context.report({
        node,
        message: errorMessage,
      });
    },
  }),
};
