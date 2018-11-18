/**
 * @fileoverview Enforce img tag uses alt attribute.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { getProp, getPropValue, elementType } from 'jsx-ast-utils';

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
      const typeCheck = ['img'].concat(context.options[0]);
      const nodeType = elementType(node);

      // Only check 'img' elements and custom types.
      if (typeCheck.indexOf(nodeType) === -1) {
        return;
      }

      const roleProp = getProp(node.attributes, 'role');
      const roleValue = getPropValue(roleProp);
      const isPresentation = roleProp && typeof roleValue === 'string'
        && roleValue.toLowerCase() === 'presentation';

      if (isPresentation) {
        return;
      }

      const altProp = getProp(node.attributes, 'alt');

      // Missing alt prop error.
      if (altProp === undefined) {
        context.report({
          node,
          message: `${nodeType} elements must have an alt prop or use role="presentation".`,
        });
        return;
      }

      // Check if alt prop is undefined.
      const altValue = getPropValue(altProp);
      const isNullValued = altProp.value === null; // <img alt />

      if ((altValue && !isNullValued) || altValue === '') {
        return;
      }

      // Undefined alt prop error.
      context.report({
        node,
        message:
          `Invalid alt value for ${nodeType}. \
Use alt="" or role="presentation" for presentational images.`,
      });
    },
  }),
};
