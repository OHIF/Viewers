/**
 * @fileoverview Enforce no accesskey attribute on element.
 * @author Ethan Cohen
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import { RuleTester } from 'eslint';
import rule from '../../../src/rules/no-access-key';

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
  message: 'No access key attribute allowed. Inconsistencies ' +
  'between keyboard shortcuts and keyboard comments used by screenreader ' +
  'and keyboard only users create a11y complications.',
  type: 'JSXOpeningElement',
};

ruleTester.run('no-access-key', rule, {
  valid: [
    { code: '<div />;', parserOptions },
    { code: '<div {...props} />', parserOptions },
    { code: '<div accessKey={undefined} />', parserOptions },
    { code: '<div accessKey={`${undefined}`} />', parserOptions },
    { code: '<div accessKey={`${undefined}${undefined}`} />', parserOptions },
  ],
  invalid: [
    { code: '<div accesskey="h" />', errors: [expectedError], parserOptions },
    { code: '<div accessKey="h" />', errors: [expectedError], parserOptions },
    { code: '<div accessKey="h" {...props} />', errors: [expectedError], parserOptions },
    { code: '<div acCesSKeY="y" />', errors: [expectedError], parserOptions },
    { code: '<div accessKey={"y"} />', errors: [expectedError], parserOptions },
    { code: '<div accessKey={`${y}`} />', errors: [expectedError], parserOptions },
    {
      code: '<div accessKey={`${undefined}y${undefined}`} />',
      errors: [expectedError],
      parserOptions,
    },
    { code: '<div accessKey={`This is ${bad}`} />', errors: [expectedError], parserOptions },
    { code: '<div accessKey={accessKey} />', errors: [expectedError], parserOptions },
  ],
});
