import { createStudyBrowserTabs } from './createStudyBrowserTabs';

const mockDisplaySets = [
  { displaySetInstanceUID: 'ds-2', StudyInstanceUID: 'study', SeriesNumber: 2 },
  { displaySetInstanceUID: 'ds-1', StudyInstanceUID: 'study', SeriesNumber: 1 },
  { displaySetInstanceUID: 'ds-3', StudyInstanceUID: 'study', SeriesNumber: 3 },
];

let mockDisplaySetSort = null;

jest.mock('../contextProviders/SystemProvider', () => ({
  useSystem: () => ({
    servicesManager: {
      services: {
        displaySetService: {
          getDisplaySetByUID: uid => mockDisplaySets.find(ds => ds.displaySetInstanceUID === uid),
          getDisplaySetSort: () => mockDisplaySetSort,
        },
        customizationService: {
          // The default series order, deliberately not the series number order.
          getCustomization: () => (a, b) =>
            a.displaySetInstanceUID === 'ds-2' ? -1 : b.displaySetInstanceUID === 'ds-2' ? 1 : 0,
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

  it('breaks ties under the picked sort with the default order, in the picked direction', () => {
    const sameDate = () => 0;
    mockDisplaySetSort = { sortFn: sameDate, direction: 'descending' };
    expect(seriesNumbersShown().at(-1)).toBe(2);
    expect(seriesNumbersShown([...mockDisplaySets].reverse()).at(-1)).toBe(2);
    mockDisplaySetSort = { sortFn: sameDate, direction: 'ascending' };
    expect(seriesNumbersShown([...mockDisplaySets].reverse())[0]).toBe(2);
  });
});
