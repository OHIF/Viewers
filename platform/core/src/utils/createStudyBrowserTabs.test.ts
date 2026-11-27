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

const displaySetService = {
  getDisplaySetByUID: uid => mockDisplaySets.find(ds => ds.displaySetInstanceUID === uid),
  getSortCriteria: () => mockSortCriteriaFor(mockDisplaySetSort, mockDefaultOrder),
};

const seriesNumbersShown = (displaySets = mockDisplaySets) =>
  createStudyBrowserTabs(
    ['study'],
    [{ studyInstanceUid: 'study' }],
    [...displaySets],
    undefined,
    displaySetService
  )[0].studies[0].displaySets.map(ds => ds.SeriesNumber);

const bySeriesNumber = (a, b) => a.SeriesNumber - b.SeriesNumber;

const uidsOf = (tabs, name) =>
  tabs.find(tab => tab.name === name).studies.map(study => study.studyInstanceUid);

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

  // The panel formats `date` in the language of the interface. These are the
  // French dates ("DD MMM YYYY"), which the Date parser cannot read.
  const frenchStudies = [
    { studyInstanceUid: 'jan-2015', studyDate: '20150110', date: '10 janv. 2015' },
    { studyInstanceUid: 'jan-2017', studyDate: '20170125', date: '25 janv. 2017' },
    { studyInstanceUid: 'jun-2016', studyDate: '20160612', date: '12 juin 2016' },
    { studyInstanceUid: 'mar-2010', studyDate: '20100301', date: '01 mars 2010' },
  ];

  it('sorts the studies newest first when the display date is not in English', () => {
    const tabs = createStudyBrowserTabs(
      ['jan-2017'],
      frenchStudies,
      [],
      undefined,
      displaySetService
    );

    expect(uidsOf(tabs, 'all')).toEqual(['jan-2017', 'jun-2016', 'jan-2015', 'mar-2010']);
  });

  it('finds the recent studies when the display date is not in English', () => {
    // Recent: at most one year older than the primary study, or newer.
    const tabs = createStudyBrowserTabs(
      ['jun-2016'],
      frenchStudies,
      [],
      undefined,
      displaySetService
    );

    expect(uidsOf(tabs, 'recent')).toEqual(['jan-2017', 'jun-2016']);
  });

  it('sorts on the display date when the caller gives no DICOM study date', () => {
    const englishStudies = [
      { studyInstanceUid: 'jan-2015', date: '10-Jan-2015' },
      { studyInstanceUid: 'jan-2017', date: '25-Jan-2017' },
      { studyInstanceUid: 'jun-2016', date: '12-Jun-2016' },
    ];

    const tabs = createStudyBrowserTabs(
      ['jan-2017'],
      englishStudies,
      [],
      undefined,
      displaySetService
    );

    expect(uidsOf(tabs, 'all')).toEqual(['jan-2017', 'jun-2016', 'jan-2015']);
    expect(uidsOf(tabs, 'recent')).toEqual(['jan-2017', 'jun-2016']);
  });
});
