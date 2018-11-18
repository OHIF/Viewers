/**
 * @fileoverview Enforce anchor elements to contain accessible content.
 * @author Lisa Ring & Niklas Holmberg
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { elementType, hasAnyProp } from 'jsx-ast-utils';
import isHiddenFromScreenReader from '../util/isHiddenFromScreenReader';

const errorMessage =
    'Anchors must have content and the content must be accessible by a screen reader.';

const anchors = [
  'a',
  'Link',
];

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
      const typeCheck = anchors.concat(context.options[0]);
      const nodeType = elementType(node);

      // Only check anchor elements and custom types.
      if (typeCheck.indexOf(nodeType) === -1) {
        return;
      }
      const isAccessible = node.parent.children.some((child) => {
        switch (child.type) {
          case 'Literal':
            return Boolean(child.value);
          case 'JSXElement':
            return !isHiddenFromScreenReader(
                elementType(child.openingElement),
                child.openingElement.attributes
            );
          case 'JSXExpressionContainer':
            if (child.expression.type === 'Identifier') {
              return child.expression.name !== 'undefined';
            }
            return true;
          default:
            return false;
        }
      }) || hasAnyProp(node.attributes, ['dangerouslySetInnerHTML', 'children']);


      if (isAccessible) {
        return;
      }

      context.report({
        node,
        message: errorMessage,
      });
    },
  }),
};
