import { createStudyBrowserTabs } from './createStudyBrowserTabs';

jest.mock('i18next', () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}));

jest.mock('../contextProviders/SystemProvider', () => ({
  useSystem: () => ({
    servicesManager: {
      services: {
        displaySetService: { getDisplaySetByUID: () => undefined },
        customizationService: { getCustomization: () => () => 0 },
      },
    },
  }),
}));

const uidsOf = (tabs, name) =>
  tabs.find(tab => tab.name === name).studies.map(study => study.studyInstanceUid);

describe('createStudyBrowserTabs', () => {
  // The panel formats `date` in the language of the interface. These are the
  // French dates ("DD MMM YYYY"), which the Date parser cannot read.
  const frenchStudies = [
    { studyInstanceUid: 'jan-2015', studyDate: '20150110', date: '10 janv. 2015' },
    { studyInstanceUid: 'jan-2017', studyDate: '20170125', date: '25 janv. 2017' },
    { studyInstanceUid: 'jun-2016', studyDate: '20160612', date: '12 juin 2016' },
    { studyInstanceUid: 'mar-2010', studyDate: '20100301', date: '01 mars 2010' },
  ];

  it('sorts the studies newest first when the display date is not in English', () => {
    const tabs = createStudyBrowserTabs(['jan-2017'], frenchStudies, []);

    expect(uidsOf(tabs, 'all')).toEqual(['jan-2017', 'jun-2016', 'jan-2015', 'mar-2010']);
  });

  it('finds the recent studies when the display date is not in English', () => {
    // Recent: at most one year older than the primary study, or newer.
    const tabs = createStudyBrowserTabs(['jun-2016'], frenchStudies, []);

    expect(uidsOf(tabs, 'recent')).toEqual(['jan-2017', 'jun-2016']);
  });

  it('sorts on the display date when the caller gives no DICOM study date', () => {
    const englishStudies = [
      { studyInstanceUid: 'jan-2015', date: '10-Jan-2015' },
      { studyInstanceUid: 'jan-2017', date: '25-Jan-2017' },
      { studyInstanceUid: 'jun-2016', date: '12-Jun-2016' },
    ];

    const tabs = createStudyBrowserTabs(['jan-2017'], englishStudies, []);

    expect(uidsOf(tabs, 'all')).toEqual(['jan-2017', 'jun-2016', 'jan-2015']);
    expect(uidsOf(tabs, 'recent')).toEqual(['jan-2017', 'jun-2016']);
  });
});
