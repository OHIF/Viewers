import DisplaySetService from './DisplaySetService';

describe('DisplaySetService — sortDisplaySets', () => {
  const bySeriesNumber = (a, b) => a.SeriesNumber - b.SeriesNumber;

  it('reports no sort until one is applied', () => {
    expect(new DisplaySetService().getDisplaySetSort()).toBeNull();
  });

  it('remembers the sort it applied, so the study browser can apply it too', () => {
    const service = new DisplaySetService();
    service.activeDisplaySets = [{ SeriesNumber: 1 }, { SeriesNumber: 3 }, { SeriesNumber: 2 }];

    service.sortDisplaySets(bySeriesNumber, 'descending');

    expect(service.activeDisplaySets.map(ds => ds.SeriesNumber)).toEqual([3, 2, 1]);
    expect(service.getDisplaySetSort()).toEqual({
      sortFn: bySeriesNumber,
      direction: 'descending',
    });
  });

  it('forgets the sort when the mode exits, so the next study starts in the default order', () => {
    const service = new DisplaySetService();
    service.sortDisplaySets(bySeriesNumber, 'descending');

    service.onModeExit();

    expect(service.getDisplaySetSort()).toBeNull();
  });

  it('orders by the applied sort, breaking ties with the default order in the same direction', () => {
    const service = new DisplaySetService();
    const sameDate = () => 0;
    const byDescription = (a, b) => a.SeriesDescription.localeCompare(b.SeriesDescription);
    const displaySets = [
      { SeriesDescription: 'b', SeriesNumber: 1 },
      { SeriesDescription: 'a', SeriesNumber: 2 },
    ];

    expect(service.getSortCriteria(byDescription)).toBe(byDescription);

    service.sortDisplaySets(sameDate, 'descending');
    expect(
      [...displaySets].sort(service.getSortCriteria(byDescription)).map(ds => ds.SeriesNumber)
    ).toEqual([1, 2]);

    service.sortDisplaySets(bySeriesNumber, 'descending');
    expect(
      [...displaySets].sort(service.getSortCriteria(byDescription)).map(ds => ds.SeriesNumber)
    ).toEqual([2, 1]);
  });
});
