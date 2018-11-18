/**
 * @fileoverview Enforce heading (h1, h2, etc) elements contain accessible content.
 * @author Ethan Cohen
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import { RuleTester } from 'eslint';
import rule from '../../../src/rules/heading-has-content';

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
  message: 'Headings must have content and the content must be accessible by a screen reader.',
  type: 'JSXOpeningElement',
};

ruleTester.run('heading-has-content', rule, {
  valid: [
    { code: '<div />;', parserOptions },
    { code: '<h1>Foo</h1>', parserOptions },
    { code: '<h2>Foo</h2>', parserOptions },
    { code: '<h3>Foo</h3>', parserOptions },
    { code: '<h4>Foo</h4>', parserOptions },
    { code: '<h5>Foo</h5>', parserOptions },
    { code: '<h6>Foo</h6>', parserOptions },
    { code: '<h6>123</h6>', parserOptions },
    { code: '<h1><Bar /></h1>', parserOptions },
    { code: '<h1>{foo}</h1>', parserOptions },
    { code: '<h1>{foo.bar}</h1>', parserOptions },
    { code: '<h1 dangerouslySetInnerHTML={{ __html: "foo" }} />', parserOptions },
    { code: '<h1 children={children} />', parserOptions },
  ],
  invalid: [
    { code: '<h1 />', errors: [expectedError], parserOptions },
    { code: '<h1><Bar aria-hidden /></h1>', errors: [expectedError], parserOptions },
    { code: '<h1>{undefined}</h1>', errors: [expectedError], parserOptions },
  ],
});
