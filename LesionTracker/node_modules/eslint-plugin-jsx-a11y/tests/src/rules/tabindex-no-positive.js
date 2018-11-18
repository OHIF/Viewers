/**
 * @fileoverview Enforce tabIndex value is not greater than zero.
 * @author Ethan Cohen
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import { RuleTester } from 'eslint';
import rule from '../../../src/rules/tabindex-no-positive';

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
  message: 'Avoid positive integer values for tabIndex.',
  type: 'JSXAttribute',
};

ruleTester.run('tabindex-no-positive', rule, {
  valid: [
    { code: '<div />;', parserOptions },
    { code: '<div {...props} />', parserOptions },
    { code: '<div id="main" />', parserOptions },
    { code: '<div tabIndex={undefined} />', parserOptions },
    { code: '<div tabIndex={`${undefined}`} />', parserOptions },
    { code: '<div tabIndex={`${undefined}${undefined}`} />', parserOptions },
    { code: '<div tabIndex={0} />', parserOptions },
    { code: '<div tabIndex={-1} />', parserOptions },
    { code: '<div tabIndex={null} />', parserOptions },
    { code: '<div tabIndex={bar()} />', parserOptions },
    { code: '<div tabIndex={bar} />', parserOptions },
    { code: '<div tabIndex={"foobar"} />', parserOptions },
    { code: '<div tabIndex="0" />', parserOptions },
    { code: '<div tabIndex="-1" />', parserOptions },
    { code: '<div tabIndex="-5" />', parserOptions },
    { code: '<div tabIndex="-5.5" />', parserOptions },
    { code: '<div tabIndex={-5.5} />', parserOptions },
    { code: '<div tabIndex={-5} />', parserOptions },
  ],

  invalid: [
    { code: '<div tabIndex="1" />', errors: [expectedError], parserOptions },
    { code: '<div tabIndex={1} />', errors: [expectedError], parserOptions },
    { code: '<div tabIndex={"1"} />', errors: [expectedError], parserOptions },
    { code: '<div tabIndex={`1`} />', errors: [expectedError], parserOptions },
    { code: '<div tabIndex={1.589} />', errors: [expectedError], parserOptions },
  ],
});
