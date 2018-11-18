/**
 * @fileoverview Enforce a clickable non-interactive element has at least 1 keyboard event listener.
 * @author Ethan Cohen
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import { RuleTester } from 'eslint';
import rule from '../../../src/rules/click-events-have-key-events';

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

const errorMessage = 'Visible, non-interactive elements with click handlers' +
' must have at least one keyboard listener.';

const expectedError = {
  message: errorMessage,
  type: 'JSXOpeningElement',
};

ruleTester.run('onclick-has-role', rule, {
  valid: [
    { code: '<div onClick={() => void 0} onKeyDown={foo}/>;', parserOptions },
    { code: '<div onClick={() => void 0} onKeyUp={foo} />;', parserOptions },
    { code: '<div onClick={() => void 0} onKeyPress={foo}/>;', parserOptions },
    { code: '<div onClick={() => void 0} onKeyDown={foo} onKeyUp={bar} />;', parserOptions },
    { code: '<div onClick={() => void 0} onKeyDown={foo} {...props} />;', parserOptions },
    { code: '<div className="foo" />;', parserOptions },
    { code: '<div onClick={() => void 0} aria-hidden />;', parserOptions },
    { code: '<div onClick={() => void 0} aria-hidden={true} />;', parserOptions },
    { code: '<div onClick={() => void 0} aria-hidden={false} onKeyDown={foo} />;', parserOptions },
    {
      code: '<div onClick={() => void 0} onKeyDown={foo} aria-hidden={undefined} />;',
      parserOptions,
    },
    { code: '<input type="text" onClick={() => void 0} />', parserOptions },
    { code: '<input onClick={() => void 0} />', parserOptions },
    { code: '<button onClick={() => void 0} className="foo" />', parserOptions },
    { code: '<option onClick={() => void 0} className="foo" />', parserOptions },
    { code: '<select onClick={() => void 0} className="foo" />', parserOptions },
    { code: '<textarea onClick={() => void 0} className="foo" />', parserOptions },
    { code: '<a tabIndex="0" onClick={() => void 0} />', parserOptions },
    { code: '<a onClick={() => void 0} href="http://x.y.z" />', parserOptions },
    { code: '<a onClick={() => void 0} href="http://x.y.z" tabIndex="0" />', parserOptions },
    { code: '<input onClick={() => void 0} type="hidden" />;', parserOptions },
    { code: '<TestComponent onClick={doFoo} />', parserOptions },
    { code: '<Button onClick={doFoo} />', parserOptions },
  ],
  invalid: [
    { code: '<div onClick={() => void 0} />;', errors: [expectedError], parserOptions },
    {
      code: '<div onClick={() => void 0} role={undefined} />;',
      errors: [expectedError],
      parserOptions,
    },
    { code: '<div onClick={() => void 0} {...props} />;', errors: [expectedError], parserOptions },
    { code: '<section onClick={() => void 0} />;', errors: [expectedError], parserOptions },
    { code: '<main onClick={() => void 0} />;', errors: [expectedError], parserOptions },
    { code: '<article onClick={() => void 0} />;', errors: [expectedError], parserOptions },
    { code: '<header onClick={() => void 0} />;', errors: [expectedError], parserOptions },
    { code: '<footer onClick={() => void 0} />;', errors: [expectedError], parserOptions },
    {
      code: '<div onClick={() => void 0} aria-hidden={false} />;',
      errors: [expectedError],
      parserOptions,
    },
    { code: '<a onClick={() => void 0} />', errors: [expectedError], parserOptions },
  ],
});
