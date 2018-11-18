/**
 * @fileoverview Enforce anchor elements to contain accessible content.
 * @author Lisa Ring & Niklas Holmberg
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import { RuleTester } from 'eslint';
import rule from '../../../src/rules/anchor-has-content';

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
  message: 'Anchors must have content and the content must be accessible by a screen reader.',
  type: 'JSXOpeningElement',
};

ruleTester.run('anchor-has-content', rule, {
  valid: [
    { code: '<div />;', parserOptions },
    { code: '<a>Foo</a>', parserOptions },
    { code: '<Link>Foo</Link>', parserOptions },
    { code: '<a><Bar /></a>', parserOptions },
    { code: '<a>{foo}</a>', parserOptions },
    { code: '<a>{foo.bar}</a>', parserOptions },
    { code: '<a dangerouslySetInnerHTML={{ __html: "foo" }} />', parserOptions },
    { code: '<a children={children} />', parserOptions },
  ],
  invalid: [
    { code: '<a />', errors: [expectedError], parserOptions },
    { code: '<Link />', errors: [expectedError], parserOptions },
    { code: '<a><Bar aria-hidden /></a>', errors: [expectedError], parserOptions },
    { code: '<a>{undefined}</a>', errors: [expectedError], parserOptions },
  ],
});
