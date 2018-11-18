/**
 * @fileoverview Enforce that elements with explicit or implicit roles defined contain only
 * `aria-*` properties supported by that `role`.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { getProp, getLiteralPropValue, elementType, propName } from 'jsx-ast-utils';
import ROLES from '../util/attributes/role.json';
import ARIA from '../util/attributes/ARIA.json';
import getImplicitRole from '../util/getImplicitRole';

const errorMessage = (attr, role, tag, isImplicit) => {
  if (isImplicit) {
    return `The attribute ${attr} is not supported by the role ${role}. \
This role is implicit on the element ${tag}.`;
  }

  return `The attribute ${attr} is not supported by the role ${role}.`;
};

module.exports = {
  meta: {
    docs: {},

    schema: [
      { type: 'object' },
    ],
  },

  create: context => ({
    JSXOpeningElement: (node) => {
      // If role is not explicitly defined, then try and get its implicit role.
      const type = elementType(node);
      const role = getProp(node.attributes, 'role');
      const roleValue = role ? getLiteralPropValue(role) : getImplicitRole(type, node.attributes);
      const isImplicit = roleValue && role === undefined;

      // If there is no explicit or implicit role, then assume that the element
      // can handle the global set of aria-* properties.
      // This actually isn't true - should fix in future release.
      if (typeof roleValue !== 'string' || ROLES[roleValue.toUpperCase()] === undefined) {
        return;
      }

      // Make sure it has no aria-* properties defined outside of its property set.
      const propertySet = ROLES[roleValue.toUpperCase()].props;
      const invalidAriaPropsForRole = Object.keys(ARIA)
        .filter(attribute => propertySet.indexOf(attribute) === -1);

      node.attributes.forEach((prop) => {
        if (prop.type === 'JSXSpreadAttribute') {
          return;
        }

        const name = propName(prop);
        const normalizedName = name ? name.toUpperCase() : '';

        if (invalidAriaPropsForRole.indexOf(normalizedName) > -1) {
          context.report({
            node,
            message: errorMessage(name, roleValue, type, isImplicit),
          });
        }
      });
    },
  }),
};
