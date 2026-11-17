import getSOPInstanceAttributes from './getSOPInstanceAttributes';

jest.mock('@cornerstonejs/core', () => ({ metaData: { get: jest.fn() } }));

describe('getSOPInstanceAttributes', () => {
  it('returns the display set of the annotation volume, not only its series', () => {
    // Two display sets of one series, for example a split series.
    const displaySets = [
      { uid: 'ds-1', displaySetInstanceUID: 'ds-1', SeriesInstanceUID: 'series', StudyInstanceUID: 'study' },
      { uid: 'ds-2', displaySetInstanceUID: 'ds-2', SeriesInstanceUID: 'series', StudyInstanceUID: 'study' },
    ];
    const displaySetService = {
      getDisplaySetsBy: filter => displaySets.filter(filter),
    };
    const annotation = { metadata: { volumeId: 'cornerstoneStreamingImageVolume:ds-2' } };

    expect(getSOPInstanceAttributes(undefined, displaySetService, annotation)).toEqual({
      SOPInstanceUID: undefined,
      SeriesInstanceUID: 'series',
      StudyInstanceUID: 'study',
      displaySetInstanceUID: 'ds-2',
    });
  });
});
