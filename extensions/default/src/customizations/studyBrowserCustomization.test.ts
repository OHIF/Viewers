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

  it('sorts a series with no number before the numbered ones, whatever order they come in', () => {
    const one = { SeriesNumber: 1 };
    const two = { SeriesNumber: 2 };
    const none = {};
    for (const input of [
      [two, none, one],
      [one, two, none],
      [none, one, two],
    ]) {
      expect([...input].sort(sortFunction('Series Number'))).toEqual([none, one, two]);
    }
  });

  it('sorts a series with no date before the dated ones, whatever order they come in', () => {
    const dated = { SeriesDate: '20260102' };
    const undated = {};
    const older = { SeriesDate: '20260101' };
    for (const input of [
      [dated, undated, older],
      [older, dated, undated],
      [undated, older, dated],
    ]) {
      expect([...input].sort(sortFunction('Series Date'))).toEqual([undated, older, dated]);
    }
  });

  it('orders series of the same date by series time', () => {
    const morning = { SeriesDate: '20260101', SeriesTime: '090000' };
    const noon = { SeriesDate: '20260101', SeriesTime: '120000' };
    expect(sortFunction('Series Date')(noon, morning)).toBeGreaterThan(0);
  });

  it('reports a tie for the same series number or date and time, so the default order breaks it', () => {
    expect(sortFunction('Series Number')({ SeriesNumber: 4 }, { SeriesNumber: '4' })).toBe(0);
    expect(
      sortFunction('Series Date')(
        { SeriesDate: '20260101', SeriesTime: '090000' },
        { SeriesDate: '20260101', SeriesTime: '090000' }
      )
    ).toBe(0);
  });
});
