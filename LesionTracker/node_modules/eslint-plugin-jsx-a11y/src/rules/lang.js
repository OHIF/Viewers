/**
 * @fileoverview Enforce lang attribute has a valid value.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { propName, elementType, getLiteralPropValue } from 'jsx-ast-utils';
import ISO_CODES from '../util/attributes/ISO.json';

const errorMessage =
  'lang attribute must have a valid value.';

module.exports = {
  meta: {
    docs: {},

    schema: [
      { type: 'object' },
    ],
  },

  create: context => ({
    JSXAttribute: (node) => {
      const name = propName(node);
      if (name && name.toUpperCase() !== 'LANG') {
        return;
      }

      const { parent } = node;
      const type = elementType(parent);
      if (type && type !== 'html') {
        return;
      }

      const value = getLiteralPropValue(node);

      // Don't check identifiers
      if (value === null) {
        return;
      } else if (value === undefined) {
        context.report({
          node,
          message: errorMessage,
        });

        return;
      }

      const hyphen = value.indexOf('-');
      const lang = hyphen > -1 ? value.substring(0, hyphen) : value;
      const country = hyphen > -1 ? value.substring(3) : undefined;

      if (ISO_CODES.languages.indexOf(lang) > -1
        && (country === undefined || ISO_CODES.countries.indexOf(country) > -1)) {
        return;
      }

      context.report({
        node,
        message: errorMessage,
      });
    },
  }),
};
