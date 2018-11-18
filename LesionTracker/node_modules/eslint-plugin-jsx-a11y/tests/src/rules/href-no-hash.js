/**
 * @fileoverview Enforce links may not point to just #.
 * @author Ethan Cohen
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import { RuleTester } from 'eslint';
import rule from '../../../src/rules/href-no-hash';

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
  message: 'Links must not point to "#". Use a more descriptive href or use a button instead.',
  type: 'JSXOpeningElement',
};

const string = ['Link'];
const array = [['Anchor', 'Link']];

ruleTester.run('href-no-hash', rule, {
  valid: [
    // DEFAULT ELEMENT 'a' TESTS
    { code: '<a />;', parserOptions },
    { code: '<a {...props} />', parserOptions },
    { code: '<a href="foo" />', parserOptions },
    { code: '<a href={foo} />', parserOptions },
    { code: '<a href="/foo" />', parserOptions },
    { code: '<a href={`${undefined}`} />', parserOptions },
    { code: '<div href="foo" />', parserOptions },
    { code: '<a href={`${undefined}foo`}/>', parserOptions },
    { code: '<a href={`#${undefined}foo`}/>', parserOptions },
    { code: '<a href={`#foo`}/>', parserOptions },
    { code: '<a href={"foo"}/>', parserOptions },
    { code: '<a href="#foo" />', parserOptions },
    { code: '<UX.Layout>test</UX.Layout>', parserOptions },
    { code: '<a href={this} />', parserOptions },

    // CUSTOM ELEMENT TEST FOR STRING OPTION
    { code: '<Link />;', options: string, parserOptions },
    { code: '<Link {...props} />', options: string, parserOptions },
    { code: '<Link href="foo" />', options: string, parserOptions },
    { code: '<Link href={foo} />', options: string, parserOptions },
    { code: '<Link href="/foo" />', options: string, parserOptions },
    { code: '<Link href={`${undefined}`} />', options: string, parserOptions },
    { code: '<div href="foo" />', options: string, parserOptions },
    { code: '<Link href={`${undefined}foo`}/>', options: string, parserOptions },
    { code: '<Link href={`#${undefined}foo`}/>', options: string, parserOptions },
    { code: '<Link href={`#foo`}/>', options: string, parserOptions },
    { code: '<Link href={"foo"}/>', options: string, parserOptions },
    { code: '<Link href="#foo" />', options: string, parserOptions },

    // CUSTOM ELEMENT TEST FOR ARRAY OPTION
    { code: '<Anchor />;', options: array, parserOptions },
    { code: '<Anchor {...props} />', options: array, parserOptions },
    { code: '<Anchor href="foo" />', options: array, parserOptions },
    { code: '<Anchor href={foo} />', options: array, parserOptions },
    { code: '<Anchor href="/foo" />', options: array, parserOptions },
    { code: '<Anchor href={`${undefined}`} />', options: array, parserOptions },
    { code: '<div href="foo" />', options: array, parserOptions },
    { code: '<Anchor href={`${undefined}foo`}/>', options: array, parserOptions },
    { code: '<Anchor href={`#${undefined}foo`}/>', options: array, parserOptions },
    { code: '<Anchor href={`#foo`}/>', options: array, parserOptions },
    { code: '<Anchor href={"foo"}/>', options: array, parserOptions },
    { code: '<Anchor href="#foo" />', options: array, parserOptions },
    { code: '<Link />;', options: array, parserOptions },
    { code: '<Link {...props} />', options: array, parserOptions },
    { code: '<Link href="foo" />', options: array, parserOptions },
    { code: '<Link href={foo} />', options: array, parserOptions },
    { code: '<Link href="/foo" />', options: array, parserOptions },
    { code: '<Link href={`${undefined}`} />', options: array, parserOptions },
    { code: '<div href="foo" />', options: array, parserOptions },
    { code: '<Link href={`${undefined}foo`}/>', options: array, parserOptions },
    { code: '<Link href={`#${undefined}foo`}/>', options: array, parserOptions },
    { code: '<Link href={`#foo`}/>', options: array, parserOptions },
    { code: '<Link href={"foo"}/>', options: array, parserOptions },
    { code: '<Link href="#foo" />', options: array, parserOptions },
  ],
  invalid: [
    // DEFAULT ELEMENT 'a' TESTS
    { code: '<a href="#" />', errors: [expectedError], parserOptions },
    { code: '<a href={"#"} />', errors: [expectedError], parserOptions },
    { code: '<a href={`#${undefined}`} />', errors: [expectedError], parserOptions },

    // CUSTOM ELEMENT TEST FOR STRING OPTION
    { code: '<Link href="#" />', errors: [expectedError], options: string, parserOptions },
    { code: '<Link href={"#"} />', errors: [expectedError], options: string, parserOptions },
    {
      code: '<Link href={`#${undefined}`} />',
      errors: [expectedError],
      options: string,
      parserOptions,
    },

    // CUSTOM ELEMENT TEST FOR ARRAY OPTION
    { code: '<Link href="#" />', errors: [expectedError], options: array, parserOptions },
    { code: '<Link href={"#"} />', errors: [expectedError], options: array, parserOptions },
    {
      code: '<Link href={`#${undefined}`} />',
      errors: [expectedError],
      options: array,
      parserOptions,
    },
    { code: '<Anchor href="#" />', errors: [expectedError], options: array, parserOptions },
    { code: '<Anchor href={"#"} />', errors: [expectedError], options: array, parserOptions },
    {
      code: '<Anchor href={`#${undefined}`} />',
      errors: [expectedError],
      options: array,
      parserOptions,
    },
  ],
});
