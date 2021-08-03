import * as DICOMWeb from './index.js';

describe('Top level exports', () => {
  test('should export the modules getAttribute, getAuthorizationHeader, getModalities, getName, getNumber, getString', () => {
    const expectedExports = [
      'getAttribute',
      'getAuthorizationHeader',
      'getModalities',
      'getName',
      'getNumber',
      'getString',
    ].sort();

    const exports = Object.keys(DICOMWeb.default).sort();

    expect(exports).toEqual(expectedExports);
  });
});
