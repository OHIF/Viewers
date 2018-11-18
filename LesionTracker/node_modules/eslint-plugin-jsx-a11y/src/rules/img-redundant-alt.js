/**
 * @fileoverview Enforce img alt attribute does not have the word image, picture, or photo.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { getProp, getLiteralPropValue, elementType } from 'jsx-ast-utils';
import isHiddenFromScreenReader from '../util/isHiddenFromScreenReader';

const REDUNDANT_WORDS = [
  'image',
  'photo',
  'picture',
];

const errorMessage = 'Redundant alt attribute. Screen-readers already announce ' +
  '`img` tags as an image. You don\'t need to use the words `image`, ' +
  '`photo,` or `picture` (or any specified custom words) in the alt prop.';

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
      let REDUNDANT_WORDS_EXTENDED;

      if (context.options[0]) {
        REDUNDANT_WORDS_EXTENDED = REDUNDANT_WORDS.concat(context.options[0]);
      } else {
        REDUNDANT_WORDS_EXTENDED = REDUNDANT_WORDS;
      }
      const type = elementType(node);
      if (type !== 'img') {
        return;
      }

      const altProp = getProp(node.attributes, 'alt');
      // Return if alt prop is not present.
      if (altProp === undefined) {
        return;
      }

      const value = getLiteralPropValue(altProp);
      const isVisible = isHiddenFromScreenReader(type, node.attributes) === false;

      if (typeof value === 'string' && isVisible) {
        const hasRedundancy = REDUNDANT_WORDS_EXTENDED
          .some(word => Boolean(value.match(new RegExp(`(?!{)${word}(?!})`, 'gi'))));

        if (hasRedundancy === true) {
          context.report({
            node,
            message: errorMessage,
          });
        }

        return;
      }
    },
  }),
};
