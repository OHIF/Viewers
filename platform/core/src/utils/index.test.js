import * as utils from './index.js';

describe('Top level exports', () => {
  test('should export the modules ', () => {
    const expectedExports = [
      'guid',
      'ObjectPath',
      'absoluteUrl',
      'addServers',
      'sortBy',
      'writeScript',
      'b64toBlob',
      'StackManager',
      'studyMetadataManager',
      // Updates WADO-RS metaDataManager
      'updateMetaDataManager',
      'DICOMTagDescriptions',
      'DicomLoaderService',
      'urlUtil',
      'makeCancelable',
      'hotkeys',
    ].sort();

    const exports = Object.keys(utils.default).sort();

    expect(exports).toEqual(expectedExports);
  });
});
