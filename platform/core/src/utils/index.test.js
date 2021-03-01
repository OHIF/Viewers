import * as utils from './index.js';

describe('Top level exports', () => {
  test('should export the modules ', () => {
    const expectedExports = [
      'guid',
      'ObjectPath',
      'absoluteUrl',
      'sortBy',
      'sortBySeriesDate',
      'isLowPriorityModality',
      'writeScript',
      'b64toBlob',
      'StackManager',
      'formatDate',
      'formatPN',
      //'loadAndCacheDerivedDisplaySets',
      'DicomLoaderService',
      'urlUtil',
      'makeDeferred',
      'makeCancelable',
      'hotkeys',
      'Queue',
      'isDicomUid',
      'resolveObjectPath',
      'hierarchicalListUtils',
      'progressTrackingUtils',
    ].sort();

    const exports = Object.keys(utils.default).sort();

    expect(exports).toEqual(expectedExports);
  });
});
