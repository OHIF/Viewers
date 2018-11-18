/**
 * @fileoverview Enforce non-interactive elements with
 *  click handlers use role attribute.
 * @author Ethan Cohen
 */

import { getProp, getPropValue, elementType } from 'jsx-ast-utils';
import isHiddenFromScreenReader from '../util/isHiddenFromScreenReader';
import isInteractiveElement from '../util/isInteractiveElement';

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

const errorMessage = 'Visible, non-interactive elements with click handlers must ' +
  'have role attribute.';

module.exports = {
  meta: {
    docs: {},

    schema: [
      { type: 'object' },
    ],
  },

  create: context => ({
    JSXOpeningElement: (node) => {
      const attributes = node.attributes;
      if (getProp(attributes, 'onclick') === undefined) {
        return;
      }

      const type = elementType(node);

      if (isHiddenFromScreenReader(type, attributes)) {
        return;
      } else if (isInteractiveElement(type, attributes)) {
        return;
      } else if (getPropValue(getProp(attributes, 'role'))) {
        return;
      }

      // Visible, non-interactive elements require role attribute.
      context.report({
        node,
        message: errorMessage,
      });
    },
  }),
};
