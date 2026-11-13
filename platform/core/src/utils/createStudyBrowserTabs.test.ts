import { createStudyBrowserTabs } from './createStudyBrowserTabs';
import { sortCriteriaFor as mockSortCriteriaFor } from '../services/DisplaySetService/DisplaySetService';

const mockDisplaySets = [
  { displaySetInstanceUID: 'ds-2', StudyInstanceUID: 'study', SeriesNumber: 2 },
  { displaySetInstanceUID: 'ds-1', StudyInstanceUID: 'study', SeriesNumber: 1 },
  { displaySetInstanceUID: 'ds-3', StudyInstanceUID: 'study', SeriesNumber: 3 },
];

let mockDisplaySetSort = null;
// The default series order, deliberately not the series number order.
const mockDefaultOrder = (a, b) =>
  a.displaySetInstanceUID === 'ds-2' ? -1 : b.displaySetInstanceUID === 'ds-2' ? 1 : 0;

jest.mock('../contextProviders/SystemProvider', () => ({
  useSystem: () => ({
    servicesManager: {
      services: {
        displaySetService: {
          getDisplaySetByUID: uid => mockDisplaySets.find(ds => ds.displaySetInstanceUID === uid),
          getSortCriteria: () => mockSortCriteriaFor(mockDisplaySetSort, mockDefaultOrder),
        },
      },
    },
  }),
}));

const seriesNumbersShown = (displaySets = mockDisplaySets) =>
  createStudyBrowserTabs(
    ['study'],
    [{ studyInstanceUid: 'study' }],
    [...displaySets]
  )[0].studies[0].displaySets.map(ds => ds.SeriesNumber);

const bySeriesNumber = (a, b) => a.SeriesNumber - b.SeriesNumber;

describe('createStudyBrowserTabs', () => {
  afterEach(() => {
    mockDisplaySetSort = null;
  });

  it('uses the default series order while no sort has been picked', () => {
    expect(seriesNumbersShown()[0]).toBe(2);
  });

  it('shows the series in the sort picked in the study browser', () => {
    mockDisplaySetSort = { sortFn: bySeriesNumber, direction: 'ascending' };
    expect(seriesNumbersShown()).toEqual([1, 2, 3]);
  });

  it('reverses the picked sort when the direction is descending', () => {
    mockDisplaySetSort = { sortFn: bySeriesNumber, direction: 'descending' };
    expect(seriesNumbersShown()).toEqual([3, 2, 1]);
  });

  it('keeps the default order for ties in both directions, as for the display sets of one split series', () => {
    const sameSeries = () => 0;
    for (const direction of ['ascending', 'descending']) {
      mockDisplaySetSort = { sortFn: sameSeries, direction };
      expect(seriesNumbersShown()[0]).toBe(2);
      expect(seriesNumbersShown([...mockDisplaySets].reverse())[0]).toBe(2);
    }
  });
});
