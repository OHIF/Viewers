/**
 * @fileoverview Enforce label tags have htmlFor attribute.
 * @author Ethan Cohen
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import { RuleTester } from 'eslint';
import rule from '../../../src/rules/label-has-for';

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
  message: 'Form controls using a label to identify them must be ' +
  'programmatically associated with the control using htmlFor',
  type: 'JSXOpeningElement',
};

const string = ['Label'];
const array = [['Label', 'Descriptor']];

ruleTester.run('label-has-for', rule, {
  valid: [
    // DEFAULT ELEMENT 'label' TESTS
    { code: '<label htmlFor="foo" />', parserOptions },
    { code: '<label htmlFor={"foo"} />', parserOptions },
    { code: '<label htmlFor={foo} />', parserOptions },
    { code: '<label htmlFor={`${id}`} />', parserOptions },
    { code: '<div />', parserOptions },
    { code: '<label htmlFor="foo">Test!</label>', parserOptions },
    { code: '<Label />', parserOptions }, // lower-case convention refers to real HTML elements.
    { code: '<Label htmlFor="foo" />', parserOptions },
    { code: '<UX.Layout>test</UX.Layout>', parserOptions },

    // CUSTOM ELEMENT STRING OPTION TESTS
    { code: '<Label htmlFor="foo" />', options: string, parserOptions },
    { code: '<Label htmlFor={"foo"} />', options: string, parserOptions },
    { code: '<Label htmlFor={foo} />', options: string, parserOptions },
    { code: '<Label htmlFor={`${id}`} />', options: string, parserOptions },
    { code: '<div />', options: string, parserOptions },
    { code: '<Label htmlFor="foo">Test!</Label>', options: string, parserOptions },

    // CUSTOM ELEMENT ARRAY OPTION TESTS
    { code: '<Label htmlFor="foo" />', options: array, parserOptions },
    { code: '<Label htmlFor={"foo"} />', options: array, parserOptions },
    { code: '<Label htmlFor={foo} />', options: array, parserOptions },
    { code: '<Label htmlFor={`${id}`} />', options: array, parserOptions },
    { code: '<div />', options: array, parserOptions },
    { code: '<Label htmlFor="foo">Test!</Label>', options: array, parserOptions },
    { code: '<Descriptor htmlFor="foo" />', options: array, parserOptions },
    { code: '<Descriptor htmlFor={"foo"} />', options: array, parserOptions },
    { code: '<Descriptor htmlFor={foo} />', options: array, parserOptions },
    { code: '<Descriptor htmlFor={`${id}`} />', options: array, parserOptions },
    { code: '<div />', options: array, parserOptions },
    { code: '<Descriptor htmlFor="foo">Test!</Descriptor>', options: array, parserOptions },
  ],
  invalid: [
    // DEFAULT ELEMENT 'label' TESTS
    { code: '<label id="foo" />', errors: [expectedError], parserOptions },
    { code: '<label htmlFor={undefined} />', errors: [expectedError], parserOptions },
    { code: '<label htmlFor={`${undefined}`} />', errors: [expectedError], parserOptions },
    { code: '<label>First Name</label>', errors: [expectedError], parserOptions },
    { code: '<label {...props}>Foo</label>', errors: [expectedError], parserOptions },

    // CUSTOM ELEMENT STRING OPTION TESTS
    { code: '<Label id="foo" />', errors: [expectedError], options: string, parserOptions },
    {
      code: '<Label htmlFor={undefined} />',
      errors: [expectedError],
      options: string,
      parserOptions,
    },
    {
      code: '<Label htmlFor={`${undefined}`} />',
      errors: [expectedError],
      options: string,
      parserOptions,
    },
    { code: '<Label>First Name</Label>', errors: [expectedError], options: string, parserOptions },
    {
      code: '<Label {...props}>Foo</Label>',
      errors: [expectedError],
      options: string,
      parserOptions,
    },

    // CUSTOM ELEMENT ARRAY OPTION TESTS
    { code: '<Label id="foo" />', errors: [expectedError], options: array, parserOptions },
    {
      code: '<Label htmlFor={undefined} />',
      errors: [expectedError],
      options: array,
      parserOptions,
    },
    {
      code: '<Label htmlFor={`${undefined}`} />',
      errors: [expectedError],
      options: array,
      parserOptions,
    },
    { code: '<Label>First Name</Label>', errors: [expectedError], options: array, parserOptions },
    {
      code: '<Label {...props}>Foo</Label>',
      errors: [expectedError],
      options: array,
      parserOptions,
    },
    { code: '<Descriptor id="foo" />', errors: [expectedError], options: array, parserOptions },
    {
      code: '<Descriptor htmlFor={undefined} />',
      errors: [expectedError],
      options: array,
      parserOptions,
    },
    {
      code: '<Descriptor htmlFor={`${undefined}`} />',
      errors: [expectedError],
      options: array,
      parserOptions,
    },
    {
      code: '<Descriptor>First Name</Descriptor>',
      errors: [expectedError],
      options: array,
      parserOptions,
    },
    {
      code: '<Descriptor {...props}>Foo</Descriptor>',
      errors: [expectedError],
      options: array,
      parserOptions,
    },
  ],
});
