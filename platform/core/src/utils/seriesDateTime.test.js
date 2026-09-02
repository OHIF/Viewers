import { getSeriesDateTime, getSeriesDateTimeSortKey } from './seriesDateTime';

describe('getSeriesDateTime', () => {
  test('uses the series date and time when they are the only pair', () => {
    expect(getSeriesDateTime({ SeriesDate: '20260817', SeriesTime: '093000' })).toEqual({
      SeriesDate: '20260817',
      SeriesTime: '093000',
    });
  });

  test('reports an empty date and time rather than undefined', () => {
    expect(getSeriesDateTime({})).toEqual({ SeriesDate: '', SeriesTime: '' });
  });

  test('reads the lower camel case spelling of series metadata', () => {
    expect(getSeriesDateTime({ seriesDate: '20260817', seriesTime: '093000' })).toEqual({
      SeriesDate: '20260817',
      SeriesTime: '093000',
    });
  });

  test('takes the latest date of all the attributes', () => {
    expect(
      getSeriesDateTime({
        SeriesDate: '20260817',
        SeriesTime: '090000',
        ContentDate: '20260819',
        ContentTime: '140000',
      })
    ).toEqual({ SeriesDate: '20260819', SeriesTime: '140000' });
  });

  // A report saved into an existing series keeps the series date and time of
  // the day the series was first created, so only the instance level date and
  // time say that it has just been added to.
  test('prefers the instance date over an older series date', () => {
    expect(
      getSeriesDateTime({
        SeriesDate: '20260817',
        SeriesTime: '090000',
        InstanceCreationDate: '20260819',
        InstanceCreationTime: '143000',
      })
    ).toEqual({ SeriesDate: '20260819', SeriesTime: '143000' });
  });

  test('takes the latest time of the attributes carrying the winning date', () => {
    expect(
      getSeriesDateTime({
        SeriesDate: '20260819',
        SeriesTime: '090000',
        ContentDate: '20260819',
        ContentTime: '140000',
        StructureSetDate: '20260817',
        StructureSetTime: '235959',
      })
    ).toEqual({ SeriesDate: '20260819', SeriesTime: '140000' });
  });

  // Combining a date with the time of a different date would report a
  // timestamp that never existed, and could order the display set anywhere
  // within its day.
  test('never takes a time from a date other than the winning one', () => {
    expect(
      getSeriesDateTime({
        SeriesDate: '20260818',
        StructureSetDate: '20260817',
        StructureSetTime: '090000',
      })
    ).toEqual({ SeriesDate: '20260818', SeriesTime: '' });
  });

  test('uses the time of the winning date even when it comes from another attribute', () => {
    expect(
      getSeriesDateTime({
        SeriesDate: '20260817',
        StructureSetDate: '20260817',
        StructureSetTime: '090000',
      })
    ).toEqual({ SeriesDate: '20260817', SeriesTime: '090000' });
  });

  test('ignores a time that has no date with it', () => {
    expect(getSeriesDateTime({ SeriesTime: '090000', ContentDate: '20260817' })).toEqual({
      SeriesDate: '20260817',
      SeriesTime: '',
    });
  });

  test('ignores the study date, which every series in the study shares', () => {
    expect(getSeriesDateTime({ StudyDate: '20260819', StudyTime: '080000' })).toEqual({
      SeriesDate: '',
      SeriesTime: '',
    });
  });

  test('splits a combined acquisition date time', () => {
    expect(getSeriesDateTime({ AcquisitionDateTime: '20260819143000.000000' })).toEqual({
      SeriesDate: '20260819',
      SeriesTime: '143000.000000',
    });
  });

  test('takes the latest date time of an array of instances', () => {
    const instances = [
      { ContentDate: '20260817', ContentTime: '090000' },
      { ContentDate: '20260819', ContentTime: '143000' },
      { ContentDate: '20260818', ContentTime: '235959' },
    ];

    expect(getSeriesDateTime(instances)).toEqual({
      SeriesDate: '20260819',
      SeriesTime: '143000',
    });
  });
});

describe('getSeriesDateTimeSortKey', () => {
  const sortKey = source => getSeriesDateTimeSortKey(source);

  test('is empty with no date, which sorts as the oldest', () => {
    expect(sortKey({})).toBe('');
    expect(sortKey({ SeriesDate: '20260817' }) > '').toBe(true);
  });

  // HHMM and HHMMSS name the same instant, so they have to compare as equal.
  test('pads times to a fixed width so equal instants compare as equal', () => {
    expect(sortKey({ SeriesDate: '20260817', SeriesTime: '0930' })).toBe(
      sortKey({ SeriesDate: '20260817', SeriesTime: '093000.0' })
    );
  });

  test('sorts a date with no time before the timed values of that date', () => {
    expect(
      sortKey({ SeriesDate: '20260817' }) <
        sortKey({ SeriesDate: '20260817', SeriesTime: '000000' })
    ).toBe(true);
  });

  test('orders by date first and then by time', () => {
    expect(
      sortKey({ SeriesDate: '20260817', SeriesTime: '235959' }) <
        sortKey({ SeriesDate: '20260818', SeriesTime: '000000' })
    ).toBe(true);
    expect(
      sortKey({ SeriesDate: '20260818', SeriesTime: '093000' }) <
        sortKey({ SeriesDate: '20260818', SeriesTime: '093001' })
    ).toBe(true);
  });
});
