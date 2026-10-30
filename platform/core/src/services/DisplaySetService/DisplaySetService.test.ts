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
});
