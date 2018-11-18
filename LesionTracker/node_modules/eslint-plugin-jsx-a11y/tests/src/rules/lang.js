/**
 * @fileoverview Enforce lang attribute has a valid value.
 * @author Ethan Cohen
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import { RuleTester } from 'eslint';
import rule from '../../../src/rules/lang';

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

const expectedError = {
  message: 'lang attribute must have a valid value.',
  type: 'JSXAttribute',
};

ruleTester.run('lang', rule, {
  valid: [
    { code: '<div />;', parserOptions },
    { code: '<div foo="bar" />;', parserOptions },
    { code: '<div lang="foo" />;', parserOptions },
    { code: '<html lang="en" />', parserOptions },
    { code: '<html lang="en-US" />', parserOptions },
    { code: '<html lang={foo} />', parserOptions },
    { code: '<HTML lang="foo" />', parserOptions },
    { code: '<Foo lang="bar" />', parserOptions },
  ],
  invalid: [
    { code: '<html lang="foo" />', errors: [expectedError], parserOptions },
    { code: '<html lang="zz-LL" />', errors: [expectedError], parserOptions },
    { code: '<html lang={undefined} />', errors: [expectedError], parserOptions },
  ],
});
