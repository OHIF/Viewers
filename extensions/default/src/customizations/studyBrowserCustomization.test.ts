import studyBrowserCustomization from './studyBrowserCustomization';

const sortFunction = label =>
  studyBrowserCustomization['studyBrowser.sortFunctions'].find(sort => sort.label === label)
    .sortFunction;

describe('studyBrowser.sortFunctions', () => {
  it('sorts by series number lowest first, so that ascending means lowest first', () => {
    const series = [{ SeriesNumber: 3 }, { SeriesNumber: 1 }, { SeriesNumber: 2 }];
    expect(series.sort(sortFunction('Series Number')).map(ds => ds.SeriesNumber)).toEqual([
      1, 2, 3,
    ]);
  });

  it('sorts by series date oldest first, so that ascending means oldest first', () => {
    const series = [
      { SeriesDate: '20260103' },
      { SeriesDate: '20260101' },
      { SeriesDate: '20260102' },
    ];
    expect(series.sort(sortFunction('Series Date')).map(ds => ds.SeriesDate)).toEqual([
      '20260101',
      '20260102',
      '20260103',
    ]);
  });

  it('sorts a series with no date before the dated ones, whatever order they come in', () => {
    const dated = { SeriesDate: '20260102', SeriesInstanceUID: '1.3' };
    const undated = { SeriesInstanceUID: '1.2' };
    const older = { SeriesDate: '20260101', SeriesInstanceUID: '1.1' };
    for (const input of [
      [dated, undated, older],
      [older, dated, undated],
      [undated, older, dated],
    ]) {
      expect([...input].sort(sortFunction('Series Date'))).toEqual([undated, older, dated]);
    }
  });
});
