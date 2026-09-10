import {
  getDateTimeSortKey,
  expandDicomDateTime,
  getSeriesDateTime,
  getSeriesDateTimeSortKey,
  parseUTCOffset,
} from './seriesDateTime';

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

  // A SEG is authored after the series it segments, and carries that in its
  // structure set date/time while the series date/time stay those of the
  // images.  The structure set pair is the one that says when the SEG was made.
  test('prefers a later structure set date over the series date of a SEG', () => {
    expect(
      getSeriesDateTime({
        Modality: 'SEG',
        SeriesDate: '20260817',
        SeriesTime: '090000',
        StructureSetDate: '20260819',
        StructureSetTime: '143000',
      })
    ).toEqual({ SeriesDate: '20260819', SeriesTime: '143000' });
  });

  // The winning date takes no time at all rather than the series time, which
  // belongs to the day the images were acquired and not to the SEG.
  test('leaves the time empty when the later SEG date carries none', () => {
    expect(
      getSeriesDateTime({
        Modality: 'SEG',
        SeriesDate: '20260817',
        SeriesTime: '090000',
        StructureSetDate: '20260819',
      })
    ).toEqual({ SeriesDate: '20260819', SeriesTime: '' });
  });

  test('ignores a time that has no date with it', () => {
    expect(getSeriesDateTime({ SeriesTime: '090000', ContentDate: '20260817' })).toEqual({
      SeriesDate: '20260817',
      SeriesTime: '',
    });
  });

  // Some series level metadata carries a date already formatted for display.
  // `19-Jan-2026` would read as `192026`, ordering by day of month and making
  // two different months compare as equal, so it counts as no date at all.
  test('ignores a date that is not a DICOM DA value', () => {
    expect(getSeriesDateTime({ SeriesDate: '19-Jan-2026' })).toEqual({
      SeriesDate: '',
      SeriesTime: '',
    });
    expect(getSeriesDateTimeSortKey({ seriesDate: '05-Feb-2026' })).toBe('');
  });

  test('reads the dotted date of the retired DICOM form', () => {
    expect(getSeriesDateTime({ SeriesDate: '2026.08.17' })).toEqual({
      SeriesDate: '2026.08.17',
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

  // Two DT values that name the same instant in two different zones have to
  // order as equal, whatever zone the viewer is in.  Reading the offset as a
  // part of the time gave `20260819+0500` five in the morning, and made the
  // `05` of `202608191030-0500` the seconds.
  test.each([
    ['a full value', '20260819100000.000000-0500', '20260819150000.000000+0000'],
    ['a value with no seconds', '202608191030-0500', '202608191530+0000'],
    ['a value with no time', '20260819+0000', '20260818200000-0400'],
    ['a value that crosses the day boundary', '20260819233000-0500', '20260820043000+0000'],
  ])('gives one sort key to %s in two zones', (_name, west, utc) => {
    expect(getSeriesDateTimeSortKey({ AcquisitionDateTime: west })).toBe(
      getSeriesDateTimeSortKey({ AcquisitionDateTime: utc })
    );
  });

  // The equality above has to hold in the zone the viewer runs in, whichever
  // one that is.  It failed in CI and passed on a developer machine, because
  // one of the two values declared the offset the machine was already in and
  // came back with no time, while the other was moved and gained one.
  test.each([[0], [-5 * 60], [5 * 60 + 30], [12 * 60]])(
    'gives one sort key to one instant when the viewer is at %s minutes',
    localOffsetMinutes => {
      const west = expandDicomDateTime('20260819100000-0500', localOffsetMinutes);
      const utc = expandDicomDateTime('20260819150000+0000', localOffsetMinutes);
      const dateOnly = expandDicomDateTime('20260819+0000', localOffsetMinutes);
      const midnight = expandDicomDateTime('20260819000000+0000', localOffsetMinutes);

      expect(west).toEqual(utc);
      expect(getDateTimeSortKey(dateOnly.SeriesDate, dateOnly.SeriesTime)).toBe(
        getDateTimeSortKey(midnight.SeriesDate, midnight.SeriesTime)
      );
    }
  );

  test('leaves a combined date time that declares no offset exactly as it is', () => {
    expect(getSeriesDateTime({ AcquisitionDateTime: '20260819' })).toEqual({
      SeriesDate: '20260819',
      SeriesTime: '',
    });
    expect(getSeriesDateTime({ AcquisitionDateTime: '202608191030' })).toEqual({
      SeriesDate: '20260819',
      SeriesTime: '1030',
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

describe('parseUTCOffset', () => {
  test.each([
    ['+0000', 0],
    ['-0500', -300],
    ['+0930', 570],
    ['+1400', 840],
  ])('reads %s as %s minutes ahead of UTC', (value, expected) => {
    expect(parseUTCOffset(value)).toBe(expected);
  });

  test.each([[undefined], [''], ['0500'], ['+05:00'], ['not an offset']])(
    'reports %s as no offset',
    value => {
      expect(parseUTCOffset(value)).toBeUndefined();
    }
  );
});

/**
 * The local offset is supplied to every case here, so the expected value does
 * not depend on the zone the test runs in.  `getSeriesDateTime` supplies none
 * and gets the viewer's own offset at that instant instead.
 */
describe('expandDicomDateTime', () => {
  const utc = 0;
  const newYork = -5 * 60;
  const chicago = -6 * 60;
  const adelaide = 9 * 60 + 30;

  // Neither side is UTC here, so this pins the direction of both halves of the
  // move: noon at -0400 is 16:00 UTC, and 16:00 UTC is 10:00 at -0600.  The
  // result is what a value carrying no offset at all would have to hold to name
  // the same instant, because such a value is read as local.
  test('moves a value between two offsets that are both behind UTC', () => {
    expect(expandDicomDateTime('20260819120000-0400', chicago)).toEqual({
      SeriesDate: '20260819',
      SeriesTime: '100000',
    });
    // The same instant written in UTC, and the same answer.
    expect(expandDicomDateTime('20260819160000+0000', chicago)).toEqual({
      SeriesDate: '20260819',
      SeriesTime: '100000',
    });
    // And the other way round, so a wrong sign cannot pass both.
    expect(expandDicomDateTime('20260819100000-0600', -4 * 60)).toEqual({
      SeriesDate: '20260819',
      SeriesTime: '120000',
    });
  });

  test('reads a DT that declares no offset exactly as it is', () => {
    expect(expandDicomDateTime('20260819143000.000000', newYork)).toEqual({
      SeriesDate: '20260819',
      SeriesTime: '143000.000000',
    });
  });

  test('keeps a DT that is already in the local offset', () => {
    expect(expandDicomDateTime('20260819143000-0500', newYork)).toEqual({
      SeriesDate: '20260819',
      SeriesTime: '143000',
    });
  });

  // A date alone gets the time of the start of that day even when it needs no
  // move.  Returning a date alone here would order the value before the same
  // instant written out in another offset, which does get a time.
  test('gives a date alone the start of the day even in the local offset', () => {
    expect(expandDicomDateTime('20260819-0500', newYork)).toEqual({
      SeriesDate: '20260819',
      SeriesTime: '0000',
    });
  });

  test('moves a DT to the local offset', () => {
    expect(expandDicomDateTime('20260819150000+0000', newYork)).toEqual({
      SeriesDate: '20260819',
      SeriesTime: '100000',
    });
    expect(expandDicomDateTime('20260819100000-0500', utc)).toEqual({
      SeriesDate: '20260819',
      SeriesTime: '150000',
    });
  });

  test('moves a DT across the day boundary', () => {
    // Half past eleven at night in New York is half past four the next morning
    // in UTC.
    expect(expandDicomDateTime('20260819233000-0500', utc)).toEqual({
      SeriesDate: '20260820',
      SeriesTime: '043000',
    });
    // And half past midnight in UTC is still the previous evening there.
    expect(expandDicomDateTime('20260820003000+0000', newYork)).toEqual({
      SeriesDate: '20260819',
      SeriesTime: '193000',
    });
  });

  // A DT holding a date alone names the start of that day, which is the reading
  // the move needs.  The time it gains is a real one, so it is reported.
  test('reads a date alone as the start of that day', () => {
    expect(expandDicomDateTime('20260819+0000', newYork)).toEqual({
      SeriesDate: '20260818',
      SeriesTime: '1900',
    });
  });

  test('moves by an offset that is not a whole number of hours', () => {
    // 09:30 ahead of UTC, so 14:30 UTC is midnight the next day in Adelaide.
    expect(expandDicomDateTime('20260819143000+0000', adelaide)).toEqual({
      SeriesDate: '20260820',
      SeriesTime: '000000',
    });
  });

  test('keeps the seconds and the fraction of the source', () => {
    expect(expandDicomDateTime('20260819150012.345678+0000', newYork)).toEqual({
      SeriesDate: '20260819',
      SeriesTime: '100012.345678',
    });
  });

  // A DT truncated to the hour or the minute gains the minutes the move needs,
  // and nothing below them.
  test.each([
    ['20260819', '2026081900', '20260818', '1900'],
    ['20260819', '202608191030', '20260819', '0530'],
  ])('expands the truncated DT %s / %s', (_date, value, SeriesDate, SeriesTime) => {
    expect(expandDicomDateTime(`${value}+0000`, newYork)).toEqual({ SeriesDate, SeriesTime });
  });

  test.each([[undefined], [''], ['2026'], ['202608'], ['not a date time']])(
    'reports %s as no date time at all',
    value => {
      expect(expandDicomDateTime(value, utc)).toBeUndefined();
    }
  );
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
