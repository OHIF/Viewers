/**
 * @fileoverview Enforce that elements with ARIA roles must
 *  have all required attributes for that role.
 * @author Ethan Cohen
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import { RuleTester } from 'eslint';
import validRoleTypes from '../../../src/util/attributes/role.json';
import rule from '../../../src/rules/role-has-required-aria-props';

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

const errorMessage = (role) => {
  const requiredProps = validRoleTypes[role.toUpperCase()].requiredProps.toString().toLowerCase();

  return {
    message: `Elements with the ARIA role "${role}" must have the following ` +
    `attributes defined: ${requiredProps}`,
    type: 'JSXAttribute',
  };
};


// Create basic test cases using all valid role types.
const basicValidityTests = Object.keys(validRoleTypes).map((role) => {
  const { requiredProps } = validRoleTypes[role];
  const propChain = requiredProps.join(' ').toLowerCase();

  return {
    code: `<div role="${role.toLowerCase()}" ${propChain} />`,
    parserOptions,
  };
});

ruleTester.run('role-has-required-aria-props', rule, {
  valid: [
    // Variables should pass, as we are only testing literals.
    { code: '<div />', parserOptions },
    { code: '<div></div>', parserOptions },
    { code: '<div role={role} />', parserOptions },
    { code: '<div role={role || "button"} />', parserOptions },
    { code: '<div role={role || "foobar"} />', parserOptions },
    { code: '<div role="tabpanel row" />', parserOptions },
    {
      code: '<span role="checkbox" aria-checked="false" aria-labelledby="foo" tabindex="0"></span>',
      parserOptions,
    },
    { code: '<Bar baz />', parserOptions },
  ].concat(basicValidityTests),

  invalid: [
    // SLIDER
    { code: '<div role="slider" />', errors: [errorMessage('slider')], parserOptions },
    {
      code: '<div role="slider" aria-valuemax />',
      errors: [errorMessage('slider')],
      parserOptions,
    },
    {
      code: '<div role="slider" aria-valuemax aria-valuemin />',
      errors: [errorMessage('slider')],
      parserOptions,
    },
    {
      code: '<div role="slider" aria-valuemax aria-valuenow />',
      errors: [errorMessage('slider')],
      parserOptions,
    },
    {
      code: '<div role="slider" aria-valuemin aria-valuenow />',
      errors: [errorMessage('slider')],
      parserOptions,
    },

    // SPINBUTTON
    { code: '<div role="spinbutton" />', errors: [errorMessage('spinbutton')], parserOptions },
    {
      code: '<div role="spinbutton" aria-valuemax />',
      errors: [errorMessage('spinbutton')],
      parserOptions,
    },
    {
      code: '<div role="spinbutton" aria-valuemax aria-valuemin />',
      errors: [errorMessage('spinbutton')],
      parserOptions,
    },
    {
      code: '<div role="spinbutton" aria-valuemax aria-valuenow />',
      errors: [errorMessage('spinbutton')],
      parserOptions,
    },
    {
      code: '<div role="spinbutton" aria-valuemin aria-valuenow />',
      errors: [errorMessage('spinbutton')],
      parserOptions,
    },

    // CHECKBOX
    { code: '<div role="checkbox" />', errors: [errorMessage('checkbox')], parserOptions },
    { code: '<div role="checkbox" checked />', errors: [errorMessage('checkbox')], parserOptions },
    {
      code: '<div role="checkbox" aria-chcked />',
      errors: [errorMessage('checkbox')],
      parserOptions,
    },
    {
      code: '<span role="checkbox" aria-labelledby="foo" tabindex="0"></span>',
      errors: [errorMessage('checkbox')],
      parserOptions,
    },

    // COMBOBOX
    { code: '<div role="combobox" />', errors: [errorMessage('combobox')], parserOptions },
    { code: '<div role="combobox" expanded />', errors: [errorMessage('combobox')], parserOptions },
    {
      code: '<div role="combobox" aria-expandd />',
      errors: [errorMessage('combobox')],
      parserOptions,
    },

    // SCROLLBAR
    { code: '<div role="scrollbar" />', errors: [errorMessage('scrollbar')], parserOptions },
    {
      code: '<div role="scrollbar" aria-valuemax />',
      errors: [errorMessage('scrollbar')],
      parserOptions,
    },
    {
      code: '<div role="scrollbar" aria-valuemax aria-valuemin />',
      errors: [errorMessage('scrollbar')],
      parserOptions,
    },
    {
      code: '<div role="scrollbar" aria-valuemax aria-valuenow />',
      errors: [errorMessage('scrollbar')],
      parserOptions,
    },
    {
      code: '<div role="scrollbar" aria-valuemin aria-valuenow />',
      errors: [errorMessage('scrollbar')],
      parserOptions,
    },
  ],
});
