import { getCurrentDicomDateTime, updateNewInstanceMetadata } from './updateNewInstanceMetadata';
import { getSeriesDateTime } from './seriesDateTime';

describe('getCurrentDicomDateTime', () => {
  // Built with the local constructor, because a DICOM DA/TM pair with no
  // timezone is the local wall clock reading of the instant.
  test('formats a date as DICOM DA and TM values', () => {
    expect(getCurrentDicomDateTime(new Date(2026, 7, 9, 4, 5, 6, 70))).toEqual({
      date: '20260809',
      time: '040506.070000',
    });
  });

  test('reads the local wall clock whatever the zone the runner is in', () => {
    const now = new Date(2026, 7, 9, 23, 30, 0, 0);

    expect(getCurrentDicomDateTime(now)).toEqual({
      date: '20260809',
      time: '233000.000000',
    });
  });

  // DA and TM say nothing about the zone they were read in, so an object that
  // declares one has to be stamped in that zone rather than the local one.
  test('reads the timezone the object declares when it has one', () => {
    const noon = new Date(Date.UTC(2026, 7, 9, 12, 0, 0, 0));

    expect(getCurrentDicomDateTime(noon, '+0000')).toEqual({
      date: '20260809',
      time: '120000.000000',
    });
    expect(getCurrentDicomDateTime(noon, '-0500')).toEqual({
      date: '20260809',
      time: '070000.000000',
    });
    expect(getCurrentDicomDateTime(noon, '+0930')).toEqual({
      date: '20260809',
      time: '213000.000000',
    });
  });

  test('crosses the day boundary in the declared timezone', () => {
    const justAfterMidnightUTC = new Date(Date.UTC(2026, 7, 9, 0, 30, 0, 0));

    // Half past midnight in UTC is still the previous evening in New York.
    expect(getCurrentDicomDateTime(justAfterMidnightUTC, '-0500')).toEqual({
      date: '20260808',
      time: '193000.000000',
    });
  });

  test('falls back to the local zone for a malformed offset', () => {
    const now = new Date(2026, 7, 9, 4, 5, 6, 70);

    expect(getCurrentDicomDateTime(now, 'not an offset')).toEqual(getCurrentDicomDateTime(now));
    expect(getCurrentDicomDateTime(now, '')).toEqual(getCurrentDicomDateTime(now));
  });
});

describe('updateNewInstanceMetadata', () => {
  const series = { StudyInstanceUID: '1.2.3', SeriesInstanceUID: '1.2.3.4' };

  test('numbers the instance above every instance already in the series', () => {
    // The most recently created instance of a series is not necessarily the one
    // with the highest instance number, so `1 +` a single predecessor is not
    // enough to stay above the rest of the series.
    const priorInstances = [{ InstanceNumber: 1 }, { InstanceNumber: 7 }, { InstanceNumber: 3 }];

    expect(updateNewInstanceMetadata({ ...series }, priorInstances).InstanceNumber).toBe(8);
  });

  test('numbers the first instance of a new series 1', () => {
    expect(updateNewInstanceMetadata({ ...series }, []).InstanceNumber).toBe(1);
  });

  test('ignores instances with no usable instance number', () => {
    const priorInstances = [{ InstanceNumber: undefined }, { InstanceNumber: '2' }, null];

    expect(updateNewInstanceMetadata({ ...series }, priorInstances).InstanceNumber).toBe(3);
  });

  // The series date and time of an instance saved into an existing series
  // belong to that series, so the instance level date and time are the only
  // ones that place it as the most recent instance.
  test('stamps an instance date and time later than the series one', () => {
    const dataset = updateNewInstanceMetadata(
      { ...series, SeriesDate: '20200101', SeriesTime: '090000' },
      []
    );

    expect(dataset.ContentDate).toBe(dataset.InstanceCreationDate);
    expect(dataset.ContentTime).toBe(dataset.InstanceCreationTime);
    expect(getSeriesDateTime(dataset)).toEqual({
      SeriesDate: dataset.ContentDate,
      SeriesTime: dataset.ContentTime,
    });
  });

  // The stamp has to be on the same clock as the rest of the object, or the
  // date/time shown for it is off by the offset between the two zones.
  test('stamps in the timezone the dataset declares', () => {
    const now = new Date();
    const dataset = updateNewInstanceMetadata(
      { ...series, TimezoneOffsetFromUTC: '+0930' },
      []
    );

    expect({ date: dataset.ContentDate, time: dataset.ContentTime.slice(0, 4) }).toEqual({
      date: getCurrentDicomDateTime(now, '+0930').date,
      time: getCurrentDicomDateTime(now, '+0930').time.slice(0, 4),
    });
  });
});
