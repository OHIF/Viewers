/**
 * @fileoverview Enforce html element has lang prop.
 * @author Ethan Cohen
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import { RuleTester } from 'eslint';
import rule from '../../../src/rules/html-has-lang';

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
  message: '<html> elements must have the lang prop.',
  type: 'JSXOpeningElement',
};

ruleTester.run('html-has-lang', rule, {
  valid: [
    { code: '<div />;', parserOptions },
    { code: '<html lang="en" />', parserOptions },
    { code: '<html lang="en-US" />', parserOptions },
    { code: '<html lang={foo} />', parserOptions },
    { code: '<html lang />', parserOptions },
    { code: '<HTML />', parserOptions },
  ],
  invalid: [
    { code: '<html />', errors: [expectedError], parserOptions },
    { code: '<html {...props} />', errors: [expectedError], parserOptions },
    { code: '<html lang={undefined} />', errors: [expectedError], parserOptions },
  ],
});
