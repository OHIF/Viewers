/**
 * @fileoverview Enforce all aria-* properties are valid.
 * @author Ethan Cohen
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import { RuleTester } from 'eslint';
import rule from '../../../src/rules/aria-props';
import ariaAttributes from '../../../src/util/attributes/ARIA.json';
import getSuggestion from '../../../src/util/getSuggestion';

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

const errorMessage = (name) => {
  const dictionary = Object.keys(ariaAttributes).map(aria => aria.toLowerCase());
  const suggestions = getSuggestion(name, dictionary);
  const message = `${name}: This attribute is an invalid ARIA attribute.`;

  if (suggestions.length > 0) {
    return {
      type: 'JSXAttribute',
      message: `${message} Did you mean to use ${suggestions}?`,
    };
  }

  return {
    type: 'JSXAttribute',
    message,
  };
};

// Create basic test cases using all valid role types.
const basicValidityTests = Object.keys(ariaAttributes).map(prop => ({
  code: `<div ${prop.toLowerCase()}="foobar" />`,
  parserOptions,
}));

ruleTester.run('aria-props', rule, {
  valid: [
    // Variables should pass, as we are only testing literals.
    { code: '<div />', parserOptions },
    { code: '<div></div>', parserOptions },
    { code: '<div aria="wee"></div>', parserOptions }, // Needs aria-*
    { code: '<div abcARIAdef="true"></div>', parserOptions },
    { code: '<div fooaria-foobar="true"></div>', parserOptions },
    { code: '<div fooaria-hidden="true"></div>', parserOptions },
    { code: '<Bar baz />', parserOptions },
  ].concat(basicValidityTests),
  invalid: [
    { code: '<div aria-="foobar" />', errors: [errorMessage('aria-')], parserOptions },
    {
      code: '<div aria-labeledby="foobar" />',
      errors: [errorMessage('aria-labeledby')],
      parserOptions,
    },
    {
      code: '<div aria-skldjfaria-klajsd="foobar" />',
      errors: [errorMessage('aria-skldjfaria-klajsd')],
      parserOptions,
    },
  ],
});
