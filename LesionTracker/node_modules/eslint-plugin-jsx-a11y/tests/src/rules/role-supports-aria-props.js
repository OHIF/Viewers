/**
 * @fileoverview Enforce that an element does not have an unsupported ARIA attribute.
 * @author Ethan Cohen
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import { RuleTester } from 'eslint';
import rule from '../../../src/rules/role-supports-aria-props';
import ROLES from '../../../src/util/attributes/role.json';
import ARIA from '../../../src/util/attributes/ARIA.json';

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

const generateErrorMessage = (attr, role, tag, isImplicit) => {
  if (isImplicit) {
    return `The attribute ${attr} is not supported by the role ${role}. \
This role is implicit on the element ${tag}.`;
  }

  return `The attribute ${attr} is not supported by the role ${role}.`;
};

const errorMessage = (attr, role, tag, isImplicit) => ({
  message: generateErrorMessage(attr, role, tag, isImplicit),
  type: 'JSXOpeningElement',
});

const nonAbstractRoles = Object.keys(ROLES).filter(role => ROLES[role].abstract === false);

const createTests = roles => roles.reduce((tests, role) => {
  const validPropsForRole = ROLES[role.toUpperCase()].props;
  const invalidPropsForRole = Object.keys(ARIA)
    .filter(attribute => validPropsForRole.indexOf(attribute) === -1);
  const normalRole = role.toLowerCase();

  const allTests = [];

  allTests[0] = tests[0].concat(validPropsForRole.map(prop => ({
    code: `<div role="${normalRole}" ${prop.toLowerCase()} />`,
    parserOptions,
  })));

  allTests[1] = tests[1].concat(invalidPropsForRole.map(prop => ({
    code: `<div role="${normalRole}" ${prop.toLowerCase()} />`,
    parserOptions,
    errors: [errorMessage(prop.toLowerCase(), normalRole, 'div', false)],
  })));

  return allTests;
}, [[], []]);

const [validTests, invalidTests] = createTests(nonAbstractRoles);

ruleTester.run('role-supports-aria-props', rule, {
  valid: [
    { code: '<Foo bar />', parserOptions },
    { code: '<div />', parserOptions },
    { code: '<div id="main" />', parserOptions },
    { code: '<div role />', parserOptions },
    { code: '<div role="presentation" {...props} />', parserOptions },
    { code: '<Foo.Bar baz={true} />', parserOptions },

    // IMPLICIT ROLE TESTS
    // A TESTS - implicit role is `link`
    { code: '<a href="#" aria-expanded />', parserOptions },
    { code: '<a href="#" aria-atomic />', parserOptions },
    { code: '<a href="#" aria-busy />', parserOptions },
    { code: '<a href="#" aria-controls />', parserOptions },
    { code: '<a href="#" aria-describedby />', parserOptions },
    { code: '<a href="#" aria-disabled />', parserOptions },
    { code: '<a href="#" aria-dropeffect />', parserOptions },
    { code: '<a href="#" aria-flowto />', parserOptions },
    { code: '<a href="#" aria-grabbed />', parserOptions },
    { code: '<a href="#" aria-haspopup />', parserOptions },
    { code: '<a href="#" aria-hidden />', parserOptions },
    { code: '<a href="#" aria-invalid />', parserOptions },
    { code: '<a href="#" aria-label />', parserOptions },
    { code: '<a href="#" aria-labelledby />', parserOptions },
    { code: '<a href="#" aria-live />', parserOptions },
    { code: '<a href="#" aria-owns />', parserOptions },
    { code: '<a href="#" aria-relevant />', parserOptions },

    // this will have global
    { code: '<a aria-checked />', parserOptions },

    // AREA TESTS - implicit role is `link`
    { code: '<area href="#" aria-expanded />', parserOptions },
    { code: '<area href="#" aria-atomic />', parserOptions },
    { code: '<area href="#" aria-busy />', parserOptions },
    { code: '<area href="#" aria-controls />', parserOptions },
    { code: '<area href="#" aria-describedby />', parserOptions },
    { code: '<area href="#" aria-disabled />', parserOptions },
    { code: '<area href="#" aria-dropeffect />', parserOptions },
    { code: '<area href="#" aria-flowto />', parserOptions },
    { code: '<area href="#" aria-grabbed />', parserOptions },
    { code: '<area href="#" aria-haspopup />', parserOptions },
    { code: '<area href="#" aria-hidden />', parserOptions },
    { code: '<area href="#" aria-invalid />', parserOptions },
    { code: '<area href="#" aria-label />', parserOptions },
    { code: '<area href="#" aria-labelledby />', parserOptions },
    { code: '<area href="#" aria-live />', parserOptions },
    { code: '<area href="#" aria-owns />', parserOptions },
    { code: '<area href="#" aria-relevant />', parserOptions },

    // this will have global
    { code: '<area aria-checked />', parserOptions },

    // LINK TESTS - implicit role is `link`
    { code: '<link href="#" aria-expanded />', parserOptions },
    { code: '<link href="#" aria-atomic />', parserOptions },
    { code: '<link href="#" aria-busy />', parserOptions },
    { code: '<link href="#" aria-controls />', parserOptions },
    { code: '<link href="#" aria-describedby />', parserOptions },
    { code: '<link href="#" aria-disabled />', parserOptions },
    { code: '<link href="#" aria-dropeffect />', parserOptions },
    { code: '<link href="#" aria-flowto />', parserOptions },
    { code: '<link href="#" aria-grabbed />', parserOptions },
    { code: '<link href="#" aria-haspopup />', parserOptions },
    { code: '<link href="#" aria-hidden />', parserOptions },
    { code: '<link href="#" aria-invalid />', parserOptions },
    { code: '<link href="#" aria-label />', parserOptions },
    { code: '<link href="#" aria-labelledby />', parserOptions },
    { code: '<link href="#" aria-live />', parserOptions },
    { code: '<link href="#" aria-owns />', parserOptions },
    { code: '<link href="#" aria-relevant />', parserOptions },

    // this will have global
    { code: '<link aria-checked />', parserOptions },

    // IMG TESTS - implicit role is `presentation`
    { code: '<img alt="" aria-atomic />', parserOptions },
    { code: '<img alt="" aria-busy />', parserOptions },
    { code: '<img alt="" aria-controls />', parserOptions },
    { code: '<img alt="" aria-describedby />', parserOptions },
    { code: '<img alt="" aria-disabled />', parserOptions },
    { code: '<img alt="" aria-dropeffect />', parserOptions },
    { code: '<img alt="" aria-flowto />', parserOptions },
    { code: '<img alt="" aria-grabbed />', parserOptions },
    { code: '<img alt="" aria-haspopup />', parserOptions },
    { code: '<img alt="" aria-hidden />', parserOptions },
    { code: '<img alt="" aria-invalid />', parserOptions },
    { code: '<img alt="" aria-label />', parserOptions },
    { code: '<img alt="" aria-labelledby />', parserOptions },
    { code: '<img alt="" aria-live />', parserOptions },
    { code: '<img alt="" aria-owns />', parserOptions },
    { code: '<img alt="" aria-relevant />', parserOptions },

    // this will have role of `img`
    { code: '<img alt="foobar" aria-busy />', parserOptions },

    // MENU TESTS - implicit role is `toolbar` when `type="toolbar"`
    { code: '<menu type="toolbar" aria-activedescendant />', parserOptions },
    { code: '<menu type="toolbar" aria-expanded />', parserOptions },
    { code: '<menu type="toolbar" aria-atomic />', parserOptions },
    { code: '<menu type="toolbar" aria-busy />', parserOptions },
    { code: '<menu type="toolbar" aria-controls />', parserOptions },
    { code: '<menu type="toolbar" aria-describedby />', parserOptions },
    { code: '<menu type="toolbar" aria-disabled />', parserOptions },
    { code: '<menu type="toolbar" aria-dropeffect />', parserOptions },
    { code: '<menu type="toolbar" aria-flowto />', parserOptions },
    { code: '<menu type="toolbar" aria-grabbed />', parserOptions },
    { code: '<menu type="toolbar" aria-haspopup />', parserOptions },
    { code: '<menu type="toolbar" aria-hidden />', parserOptions },
    { code: '<menu type="toolbar" aria-invalid />', parserOptions },
    { code: '<menu type="toolbar" aria-label />', parserOptions },
    { code: '<menu type="toolbar" aria-labelledby />', parserOptions },
    { code: '<menu type="toolbar" aria-live />', parserOptions },
    { code: '<menu type="toolbar" aria-owns />', parserOptions },
    { code: '<menu type="toolbar" aria-relevant />', parserOptions },

    // this will have global
    { code: '<menu aria-checked />', parserOptions },

    // MENUITEM TESTS
    // when `type="command`, the implicit role is `menuitem`
    { code: '<menuitem type="command" aria-atomic />', parserOptions },
    { code: '<menuitem type="command" aria-busy />', parserOptions },
    { code: '<menuitem type="command" aria-controls />', parserOptions },
    { code: '<menuitem type="command" aria-describedby />', parserOptions },
    { code: '<menuitem type="command" aria-disabled />', parserOptions },
    { code: '<menuitem type="command" aria-dropeffect />', parserOptions },
    { code: '<menuitem type="command" aria-flowto />', parserOptions },
    { code: '<menuitem type="command" aria-grabbed />', parserOptions },
    { code: '<menuitem type="command" aria-haspopup />', parserOptions },
    { code: '<menuitem type="command" aria-hidden />', parserOptions },
    { code: '<menuitem type="command" aria-invalid />', parserOptions },
    { code: '<menuitem type="command" aria-label />', parserOptions },
    { code: '<menuitem type="command" aria-labelledby />', parserOptions },
    { code: '<menuitem type="command" aria-live />', parserOptions },
    { code: '<menuitem type="command" aria-owns />', parserOptions },
    { code: '<menuitem type="command" aria-relevant />', parserOptions },
    // when `type="checkbox`, the implicit role is `menuitemcheckbox`
    { code: '<menuitem type="checkbox" aria-checked />', parserOptions },
    { code: '<menuitem type="checkbox" aria-atomic />', parserOptions },
    { code: '<menuitem type="checkbox" aria-busy />', parserOptions },
    { code: '<menuitem type="checkbox" aria-controls />', parserOptions },
    { code: '<menuitem type="checkbox" aria-describedby />', parserOptions },
    { code: '<menuitem type="checkbox" aria-disabled />', parserOptions },
    { code: '<menuitem type="checkbox" aria-dropeffect />', parserOptions },
    { code: '<menuitem type="checkbox" aria-flowto />', parserOptions },
    { code: '<menuitem type="checkbox" aria-grabbed />', parserOptions },
    { code: '<menuitem type="checkbox" aria-haspopup />', parserOptions },
    { code: '<menuitem type="checkbox" aria-hidden />', parserOptions },
    { code: '<menuitem type="checkbox" aria-invalid />', parserOptions },
    { code: '<menuitem type="checkbox" aria-label />', parserOptions },
    { code: '<menuitem type="checkbox" aria-labelledby />', parserOptions },
    { code: '<menuitem type="checkbox" aria-live />', parserOptions },
    { code: '<menuitem type="checkbox" aria-owns />', parserOptions },
    { code: '<menuitem type="checkbox" aria-relevant />', parserOptions },
    // when `type="radio`, the implicit role is `menuitemradio`
    { code: '<menuitem type="radio" aria-checked />', parserOptions },
    { code: '<menuitem type="radio" aria-atomic />', parserOptions },
    { code: '<menuitem type="radio" aria-busy />', parserOptions },
    { code: '<menuitem type="radio" aria-controls />', parserOptions },
    { code: '<menuitem type="radio" aria-describedby />', parserOptions },
    { code: '<menuitem type="radio" aria-disabled />', parserOptions },
    { code: '<menuitem type="radio" aria-dropeffect />', parserOptions },
    { code: '<menuitem type="radio" aria-flowto />', parserOptions },
    { code: '<menuitem type="radio" aria-grabbed />', parserOptions },
    { code: '<menuitem type="radio" aria-haspopup />', parserOptions },
    { code: '<menuitem type="radio" aria-hidden />', parserOptions },
    { code: '<menuitem type="radio" aria-invalid />', parserOptions },
    { code: '<menuitem type="radio" aria-label />', parserOptions },
    { code: '<menuitem type="radio" aria-labelledby />', parserOptions },
    { code: '<menuitem type="radio" aria-live />', parserOptions },
    { code: '<menuitem type="radio" aria-owns />', parserOptions },
    { code: '<menuitem type="radio" aria-relevant />', parserOptions },
    { code: '<menuitem type="radio" aria-posinset />', parserOptions },
    { code: '<menuitem type="radio" aria-selected />', parserOptions },
    { code: '<menuitem type="radio" aria-setsize />', parserOptions },

    // these will have global
    { code: '<menuitem aria-checked />', parserOptions },
    { code: '<menuitem type="foo" aria-checked />', parserOptions },

    // INPUT TESTS
    // when `type="button"`, the implicit role is `button`
    { code: '<input type="button" aria-expanded />', parserOptions },
    { code: '<input type="button" aria-pressed />', parserOptions },
    { code: '<input type="button" aria-atomic />', parserOptions },
    { code: '<input type="button" aria-busy />', parserOptions },
    { code: '<input type="button" aria-controls />', parserOptions },
    { code: '<input type="button" aria-describedby />', parserOptions },
    { code: '<input type="button" aria-disabled />', parserOptions },
    { code: '<input type="button" aria-dropeffect />', parserOptions },
    { code: '<input type="button" aria-flowto />', parserOptions },
    { code: '<input type="button" aria-grabbed />', parserOptions },
    { code: '<input type="button" aria-haspopup />', parserOptions },
    { code: '<input type="button" aria-hidden />', parserOptions },
    { code: '<input type="button" aria-invalid />', parserOptions },
    { code: '<input type="button" aria-label />', parserOptions },
    { code: '<input type="button" aria-labelledby />', parserOptions },
    { code: '<input type="button" aria-live />', parserOptions },
    { code: '<input type="button" aria-owns />', parserOptions },
    { code: '<input type="button" aria-relevant />', parserOptions },
    // when `type="image"`, the implicit role is `button`
    { code: '<input type="image" aria-expanded />', parserOptions },
    { code: '<input type="image" aria-pressed />', parserOptions },
    { code: '<input type="image" aria-atomic />', parserOptions },
    { code: '<input type="image" aria-busy />', parserOptions },
    { code: '<input type="image" aria-controls />', parserOptions },
    { code: '<input type="image" aria-describedby />', parserOptions },
    { code: '<input type="image" aria-disabled />', parserOptions },
    { code: '<input type="image" aria-dropeffect />', parserOptions },
    { code: '<input type="image" aria-flowto />', parserOptions },
    { code: '<input type="image" aria-grabbed />', parserOptions },
    { code: '<input type="image" aria-haspopup />', parserOptions },
    { code: '<input type="image" aria-hidden />', parserOptions },
    { code: '<input type="image" aria-invalid />', parserOptions },
    { code: '<input type="image" aria-label />', parserOptions },
    { code: '<input type="image" aria-labelledby />', parserOptions },
    { code: '<input type="image" aria-live />', parserOptions },
    { code: '<input type="image" aria-owns />', parserOptions },
    { code: '<input type="image" aria-relevant />', parserOptions },
    // when `type="reset"`, the implicit role is `button`
    { code: '<input type="reset" aria-expanded />', parserOptions },
    { code: '<input type="reset" aria-pressed />', parserOptions },
    { code: '<input type="reset" aria-atomic />', parserOptions },
    { code: '<input type="reset" aria-busy />', parserOptions },
    { code: '<input type="reset" aria-controls />', parserOptions },
    { code: '<input type="reset" aria-describedby />', parserOptions },
    { code: '<input type="reset" aria-disabled />', parserOptions },
    { code: '<input type="reset" aria-dropeffect />', parserOptions },
    { code: '<input type="reset" aria-flowto />', parserOptions },
    { code: '<input type="reset" aria-grabbed />', parserOptions },
    { code: '<input type="reset" aria-haspopup />', parserOptions },
    { code: '<input type="reset" aria-hidden />', parserOptions },
    { code: '<input type="reset" aria-invalid />', parserOptions },
    { code: '<input type="reset" aria-label />', parserOptions },
    { code: '<input type="reset" aria-labelledby />', parserOptions },
    { code: '<input type="reset" aria-live />', parserOptions },
    { code: '<input type="reset" aria-owns />', parserOptions },
    { code: '<input type="reset" aria-relevant />', parserOptions },
    // when `type="submit"`, the implicit role is `button`
    { code: '<input type="submit" aria-expanded />', parserOptions },
    { code: '<input type="submit" aria-pressed />', parserOptions },
    { code: '<input type="submit" aria-atomic />', parserOptions },
    { code: '<input type="submit" aria-busy />', parserOptions },
    { code: '<input type="submit" aria-controls />', parserOptions },
    { code: '<input type="submit" aria-describedby />', parserOptions },
    { code: '<input type="submit" aria-disabled />', parserOptions },
    { code: '<input type="submit" aria-dropeffect />', parserOptions },
    { code: '<input type="submit" aria-flowto />', parserOptions },
    { code: '<input type="submit" aria-grabbed />', parserOptions },
    { code: '<input type="submit" aria-haspopup />', parserOptions },
    { code: '<input type="submit" aria-hidden />', parserOptions },
    { code: '<input type="submit" aria-invalid />', parserOptions },
    { code: '<input type="submit" aria-label />', parserOptions },
    { code: '<input type="submit" aria-labelledby />', parserOptions },
    { code: '<input type="submit" aria-live />', parserOptions },
    { code: '<input type="submit" aria-owns />', parserOptions },
    { code: '<input type="submit" aria-relevant />', parserOptions },
    // when `type="checkbox"`, the implicit role is `checkbox`
    { code: '<input type="checkbox" aria-checked />', parserOptions },
    { code: '<input type="checkbox" aria-atomic />', parserOptions },
    { code: '<input type="checkbox" aria-busy />', parserOptions },
    { code: '<input type="checkbox" aria-controls />', parserOptions },
    { code: '<input type="checkbox" aria-describedby />', parserOptions },
    { code: '<input type="checkbox" aria-disabled />', parserOptions },
    { code: '<input type="checkbox" aria-dropeffect />', parserOptions },
    { code: '<input type="checkbox" aria-flowto />', parserOptions },
    { code: '<input type="checkbox" aria-grabbed />', parserOptions },
    { code: '<input type="checkbox" aria-haspopup />', parserOptions },
    { code: '<input type="checkbox" aria-hidden />', parserOptions },
    { code: '<input type="checkbox" aria-invalid />', parserOptions },
    { code: '<input type="checkbox" aria-label />', parserOptions },
    { code: '<input type="checkbox" aria-labelledby />', parserOptions },
    { code: '<input type="checkbox" aria-live />', parserOptions },
    { code: '<input type="checkbox" aria-owns />', parserOptions },
    { code: '<input type="checkbox" aria-relevant />', parserOptions },
    // when `type="radio"`, the implicit role is `radio`
    { code: '<input type="radio" aria-checked />', parserOptions },
    { code: '<input type="radio" aria-atomic />', parserOptions },
    { code: '<input type="radio" aria-busy />', parserOptions },
    { code: '<input type="radio" aria-controls />', parserOptions },
    { code: '<input type="radio" aria-describedby />', parserOptions },
    { code: '<input type="radio" aria-disabled />', parserOptions },
    { code: '<input type="radio" aria-dropeffect />', parserOptions },
    { code: '<input type="radio" aria-flowto />', parserOptions },
    { code: '<input type="radio" aria-grabbed />', parserOptions },
    { code: '<input type="radio" aria-haspopup />', parserOptions },
    { code: '<input type="radio" aria-hidden />', parserOptions },
    { code: '<input type="radio" aria-invalid />', parserOptions },
    { code: '<input type="radio" aria-label />', parserOptions },
    { code: '<input type="radio" aria-labelledby />', parserOptions },
    { code: '<input type="radio" aria-live />', parserOptions },
    { code: '<input type="radio" aria-owns />', parserOptions },
    { code: '<input type="radio" aria-relevant />', parserOptions },
    { code: '<input type="radio" aria-posinset />', parserOptions },
    { code: '<input type="radio" aria-selected />', parserOptions },
    { code: '<input type="radio" aria-setsize />', parserOptions },
    // when `type="range"`, the implicit role is `slider`
    { code: '<input type="range" aria-valuemax />', parserOptions },
    { code: '<input type="range" aria-valuemin />', parserOptions },
    { code: '<input type="range" aria-valuenow />', parserOptions },
    { code: '<input type="range" aria-orientation />', parserOptions },
    { code: '<input type="range" aria-atomic />', parserOptions },
    { code: '<input type="range" aria-busy />', parserOptions },
    { code: '<input type="range" aria-controls />', parserOptions },
    { code: '<input type="range" aria-describedby />', parserOptions },
    { code: '<input type="range" aria-disabled />', parserOptions },
    { code: '<input type="range" aria-dropeffect />', parserOptions },
    { code: '<input type="range" aria-flowto />', parserOptions },
    { code: '<input type="range" aria-grabbed />', parserOptions },
    { code: '<input type="range" aria-haspopup />', parserOptions },
    { code: '<input type="range" aria-hidden />', parserOptions },
    { code: '<input type="range" aria-invalid />', parserOptions },
    { code: '<input type="range" aria-label />', parserOptions },
    { code: '<input type="range" aria-labelledby />', parserOptions },
    { code: '<input type="range" aria-live />', parserOptions },
    { code: '<input type="range" aria-owns />', parserOptions },
    { code: '<input type="range" aria-relevant />', parserOptions },
    { code: '<input type="range" aria-valuetext />', parserOptions },

    // these will have role of `textbox`,
    { code: '<input type="email" aria-disabled />', parserOptions },
    { code: '<input type="password" aria-disabled />', parserOptions },
    { code: '<input type="search" aria-disabled />', parserOptions },
    { code: '<input type="tel" aria-disabled />', parserOptions },
    { code: '<input type="url" aria-disabled />', parserOptions },
    { code: '<input aria-disabled />', parserOptions },

    // OTHER TESTS
    { code: '<aside aria-expanded />', parserOptions },
    { code: '<article aria-expanded />', parserOptions },
    { code: '<body aria-expanded />', parserOptions },
    { code: '<button aria-pressed />', parserOptions },
    { code: '<datalist aria-expanded />', parserOptions },
    { code: '<details aria-expanded />', parserOptions },
    { code: '<dialog aria-expanded />', parserOptions },
    { code: '<dl aria-expanded />', parserOptions },
    { code: '<form aria-hidden />', parserOptions },
    { code: '<h1 aria-hidden />', parserOptions },
    { code: '<h2 aria-hidden />', parserOptions },
    { code: '<h3 aria-hidden />', parserOptions },
    { code: '<h4 aria-hidden />', parserOptions },
    { code: '<h5 aria-hidden />', parserOptions },
    { code: '<h6 aria-hidden />', parserOptions },
    { code: '<hr aria-hidden />', parserOptions },
    { code: '<li aria-expanded />', parserOptions },
    { code: '<meter aria-atomic />', parserOptions },
    { code: '<nav aria-expanded />', parserOptions },
    { code: '<ol aria-expanded />', parserOptions },
    { code: '<option aria-atomic />', parserOptions },
    { code: '<output aria-expanded />', parserOptions },
    { code: '<progress aria-atomic />', parserOptions },
    { code: '<section aria-expanded />', parserOptions },
    { code: '<select aria-expanded />', parserOptions },
    { code: '<tbody aria-expanded />', parserOptions },
    { code: '<textarea aria-hidden />', parserOptions },
    { code: '<tfoot aria-expanded />', parserOptions },
    { code: '<thead aria-expanded />', parserOptions },
    { code: '<ul aria-expanded />', parserOptions },

  ].concat(validTests),

  invalid: [
    // implicit basic checks
    {
      code: '<a href="#" aria-checked />',
      errors: [errorMessage('aria-checked', 'link', 'a', true)],
      parserOptions,
    },
    {
      code: '<area href="#" aria-checked />',
      errors: [errorMessage('aria-checked', 'link', 'area', true)],
      parserOptions,
    },
    {
      code: '<link href="#" aria-checked />',
      errors: [errorMessage('aria-checked', 'link', 'link', true)],
      parserOptions,
    },
    {
      code: '<img alt="" aria-checked />',
      errors: [errorMessage('aria-checked', 'presentation', 'img', true)],
      parserOptions,
    },
    {
      code: '<menu type="toolbar" aria-checked />',
      errors: [errorMessage('aria-checked', 'toolbar', 'menu', true)],
      parserOptions,
    },
    {
      code: '<aside aria-checked />',
      errors: [errorMessage('aria-checked', 'complementary', 'aside', true)],
      parserOptions,
    },
  ].concat(invalidTests),
});
