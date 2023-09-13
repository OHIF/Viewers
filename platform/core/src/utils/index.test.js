import * as utils from './index.js';

describe('Top level exports', () => {
  test('should export the modules ', () => {
    const expectedExports = [
      'guid',
      'ObjectPath',
      'absoluteUrl',
      'seriesSortCriteria',
      'sortBy',
      'sortStudy',
      'sortBySeriesDate',
      'sortStudyInstances',
      'sortStudySeries',
      'sortingCriteria',
      'splitComma',
      'getSplitParam',
      'isLowPriorityModality',
      'writeScript',
      'debounce',
      'downloadCSVReport',
      'imageIdToURI',
      'roundNumber',
      'b64toBlob',
      'formatDate',
      'formatPN',
      'generateAcceptHeader',
      'isEqualWithin',
      //'loadAndCacheDerivedDisplaySets',
      'isDisplaySetReconstructable',
      'isImage',
      'urlUtil',
      'makeDeferred',
      'makeCancelable',
      'hotkeys',
      'Queue',
      'isDicomUid',
      'resolveObjectPath',
      'hierarchicalListUtils',
      'progressTrackingUtils',
      'subscribeToNextViewportGridChange',
      'uuidv4',
    ].sort();

    const exports = Object.keys(utils.default).sort();

    expect(exports).toEqual(expectedExports);
  });
});
