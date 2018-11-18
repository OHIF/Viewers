/**
 * @fileoverview Enforce that elements that do not support ARIA roles,
 *  states and properties do not have those attributes.
 * @author Ethan Cohen
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import { RuleTester } from 'eslint';
import DOM from '../../../src/util/attributes/DOM.json';
import rule from '../../../src/rules/aria-unsupported-elements';

const parserOptions = {
  ecmaVersion: 6,
  ecmaFeatures: {
    jsx: true,
  },
};

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

const ruleTester = new RuleTester();

const errorMessage = invalidProp => ({
  message: `This element does not support ARIA roles, states and properties. \
Try removing the prop '${invalidProp}'.`,
  type: 'JSXOpeningElement',
});

// Generate valid test cases
const roleValidityTests = Object.keys(DOM).map((element) => {
  const isReserved = DOM[element].reserved || false;
  const role = isReserved ? '' : 'role';

  return {
    code: `<${element} ${role} />`,
    parserOptions,
  };
});

const ariaValidityTests = Object.keys(DOM).map((element) => {
  const isReserved = DOM[element].reserved || false;
  const aria = isReserved ? '' : 'aria-hidden';

  return {
    code: `<${element} ${aria} />`,
    parserOptions,
  };
});

// Generate invalid test cases.
const invalidRoleValidityTests = Object.keys(DOM)
  .filter(element => Boolean(DOM[element].reserved))
  .map(reservedElem => ({
    code: `<${reservedElem} role {...props} />`,
    errors: [errorMessage('role')],
    parserOptions,
  }));

const invalidAriaValidityTests = Object.keys(DOM)
  .filter(element => Boolean(DOM[element].reserved))
  .map(reservedElem => ({
    code: `<${reservedElem} aria-hidden {...props} />`,
    errors: [errorMessage('aria-hidden')],
    parserOptions,
  }));

ruleTester.run('aria-unsupported-elements', rule, {
  valid: roleValidityTests.concat(ariaValidityTests),
  invalid: invalidRoleValidityTests.concat(invalidAriaValidityTests),
});
