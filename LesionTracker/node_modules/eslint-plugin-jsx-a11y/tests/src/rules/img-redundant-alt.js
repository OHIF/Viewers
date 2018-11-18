/**
 * @fileoverview Enforce img alt attribute does not have the word image, picture, or photo.
 * @author Ethan Cohen
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import { RuleTester } from 'eslint';
import rule from '../../../src/rules/img-redundant-alt';

const parserOptions = {
  ecmaVersion: 6,
  ecmaFeatures: {
    jsx: true,
  },
};

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

const string = ['Word'];
const array = [['Word1', 'Word2']];

const ruleTester = new RuleTester();

const expectedError = {
  message: 'Redundant alt attribute. Screen-readers already announce `img` tags as an image. ' +
    'You don\'t need to use the words `image`, `photo,` or `picture` ' +
    '(or any specified custom words) in the alt prop.',
  type: 'JSXOpeningElement',
};

ruleTester.run('img-redundant-alt', rule, {
  valid: [
    { code: '<img alt="foo" />;', parserOptions },
    { code: '<img alt="picture of me taking a photo of an image" aria-hidden />', parserOptions },
    { code: '<img aria-hidden alt="photo of image" />', parserOptions },
    { code: '<img ALt="foo" />;', parserOptions },
    { code: '<img {...this.props} alt="foo" />', parserOptions },
    { code: '<img {...this.props} alt={"foo"} />', parserOptions },
    { code: '<img {...this.props} alt={alt} />', parserOptions },
    { code: '<a />', parserOptions },
    { code: '<img />', parserOptions },
    { code: '<IMG />', parserOptions },
    { code: '<img alt={undefined} />', parserOptions },
    { code: '<img alt={`this should pass for ${now}`} />', parserOptions },
    { code: '<img alt={`this should pass for ${photo}`} />', parserOptions },
    { code: '<img alt={`this should pass for ${image}`} />', parserOptions },
    { code: '<img alt={`this should pass for ${picture}`} />', parserOptions },
    { code: '<img alt={`${photo}`} />', parserOptions },
    { code: '<img alt={`${image}`} />', parserOptions },
    { code: '<img alt={`${picture}`} />', parserOptions },
    { code: '<img alt={"undefined"} />', parserOptions },
    { code: '<img alt={() => {}} />', parserOptions },
    { code: '<img alt={function(e){}} />', parserOptions },
    { code: '<img aria-hidden={false} alt="Doing cool things." />', parserOptions },
    { code: '<UX.Layout>test</UX.Layout>', parserOptions },
    { code: '<img alt={imageAlt} />', parserOptions },
    { code: '<img alt />', parserOptions },
  ],
  invalid: [
    { code: '<img alt="Photo of friend." />;', errors: [expectedError], parserOptions },
    { code: '<img alt="Picture of friend." />;', errors: [expectedError], parserOptions },
    { code: '<img alt="Image of friend." />;', errors: [expectedError], parserOptions },
    { code: '<img alt="PhOtO of friend." />;', errors: [expectedError], parserOptions },
    { code: '<img alt={"photo"} />;', errors: [expectedError], parserOptions },
    { code: '<img alt="piCTUre of friend." />;', errors: [expectedError], parserOptions },
    { code: '<img alt="imAGE of friend." />;', errors: [expectedError], parserOptions },
    {
      code: '<img alt="photo of cool person" aria-hidden={false} />',
      errors: [expectedError],
      parserOptions,
    },
    {
      code: '<img alt="picture of cool person" aria-hidden={false} />',
      errors: [expectedError],
      parserOptions,
    },
    {
      code: '<img alt="image of cool person" aria-hidden={false} />',
      errors: [expectedError],
      parserOptions,
    },
    { code: '<img alt="photo" {...this.props} />', errors: [expectedError], parserOptions },
    { code: '<img alt="image" {...this.props} />', errors: [expectedError], parserOptions },
    { code: '<img alt="picture" {...this.props} />', errors: [expectedError], parserOptions },
    {
      code: '<img alt={`picture doing ${things}`} {...this.props} />',
      errors: [expectedError],
      parserOptions,
    },
    {
      code: '<img alt={`photo doing ${things}`} {...this.props} />',
      errors: [expectedError],
      parserOptions,
    },
    {
      code: '<img alt={`image doing ${things}`} {...this.props} />',
      errors: [expectedError],
      parserOptions,
    },
    {
      code: '<img alt={`picture doing ${picture}`} {...this.props} />',
      errors: [expectedError],
      parserOptions,
    },
    {
      code: '<img alt={`photo doing ${photo}`} {...this.props} />',
      errors: [expectedError],
      parserOptions,
    },
    {
      code: '<img alt={`image doing ${image}`} {...this.props} />',
      errors: [expectedError],
      parserOptions,
    },

    // TESTS FOR STRING OPTION
    { code: '<img alt="Word" />;', options: string, errors: [expectedError], parserOptions },

    // TESTS FOR ARRAY OPTION TESTS
    { code: '<img alt="Word1" />;', options: array, errors: [expectedError], parserOptions },
    { code: '<img alt="Word2" />;', options: array, errors: [expectedError], parserOptions },
  ],
});
