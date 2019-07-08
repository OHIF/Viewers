import * as OHIF from './index.js';

describe('Top level exports', () => {
  test('have not changed', () => {
    const expectedExports = [
      'MODULE_TYPES',
      //
      'CommandsManager',
      'ExtensionManager',
      'HotkeysManager',
      //
      'utils',
      'studies',
      'redux',
      'classes',
      'metadata',
      'header',
      'cornerstone',
      'default', //
      'string',
      'ui',
      'user',
      'object',
      'log',
      'DICOMWeb',
      'OHIF', //
      'measurements',
      'hangingProtocols',
    ].sort();

    const exports = Object.keys(OHIF).sort();

    expect(exports).toEqual(expectedExports);
  });
});
