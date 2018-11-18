/**
 * @fileoverview Enforce <marquee> elements are not used.
 * @author Ethan Cohen
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import { RuleTester } from 'eslint';
import rule from '../../../src/rules/no-marquee';

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
  message: 'Do not use <marquee> elements as they create accessibility issues and are deprecated.',
  type: 'JSXOpeningElement',
};

ruleTester.run('no-marquee', rule, {
  valid: [
    { code: '<div />;', parserOptions },
    { code: '<Marquee />', parserOptions },
    { code: '<div marquee />', parserOptions },
  ],
  invalid: [
    { code: '<marquee />', errors: [expectedError], parserOptions },
    { code: '<marquee {...props} />', errors: [expectedError], parserOptions },
    { code: '<marquee lang={undefined} />', errors: [expectedError], parserOptions },
  ],
});
