/**
 * @fileoverview Enforce usage of onBlur over onChange on select menus for accessibility.
 * @author Ethan Cohen
 */


// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import { RuleTester } from 'eslint';
import rule from '../../../src/rules/no-onchange';

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
  message: 'onBlur must be used instead of onchange, unless absolutely necessary and it ' +
    'causes no negative consequences for keyboard only or screen reader users.',
  type: 'JSXOpeningElement',
};

ruleTester.run('no-onchange', rule, {
  valid: [
    { code: '<select onBlur={() => {}} />;', parserOptions },
    { code: '<select onBlur={handleOnBlur} />;', parserOptions },
    { code: '<option />;', parserOptions },
    { code: '<option onBlur={() => {}} onChange={() => {}} />;', parserOptions },
    { code: '<option {...props} />', parserOptions },
    { code: '<input onChange={() => {}} />;', parserOptions },
    { code: '<input onChange={handleOnChange} />;', parserOptions },
    { code: '<input />;', parserOptions },
    { code: '<input onChange={() => {}} onChange={() => {}} />;', parserOptions },
    { code: '<input {...props} />', parserOptions },
  ],
  invalid: [
    { code: '<select onChange={() => {}} />;', errors: [expectedError], parserOptions },
    { code: '<select onChange={handleOnChange} />;', errors: [expectedError], parserOptions },
    { code: '<option onChange={() => {}} />', errors: [expectedError], parserOptions },
    { code: '<option onChange={() => {}} {...props} />', errors: [expectedError], parserOptions },
  ],
});
