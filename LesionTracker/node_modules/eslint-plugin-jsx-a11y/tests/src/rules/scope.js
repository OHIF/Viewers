/**
 * @fileoverview Enforce scope prop is only used on <th> elements.
 * @author Ethan Cohen
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import { RuleTester } from 'eslint';
import rule from '../../../src/rules/scope';

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
  message: 'The scope prop can only be used on <th> elements.',
  type: 'JSXAttribute',
};

ruleTester.run('scope', rule, {
  valid: [
    { code: '<div />;', parserOptions },
    { code: '<div foo />;', parserOptions },
    { code: '<th scope />', parserOptions },
    { code: '<th scope="row" />', parserOptions },
    { code: '<th scope={foo} />', parserOptions },
    { code: '<th scope={"col"} {...props} />', parserOptions },
    { code: '<Foo scope="bar" {...props} />', parserOptions },
  ],
  invalid: [
    { code: '<div scope />', errors: [expectedError], parserOptions },
  ],
});
