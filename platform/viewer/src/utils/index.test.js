import * as utils from './index.js';

describe('utils', () => {
  it('has the expected exports', () => {
    const utilExports = Object.keys(utils).sort();

    expect(utilExports).toEqual(
      ['getUserManagerForOpenIdConnectClient', 'initWebWorkers'].sort()
    );
  });
});
