import { getCurrentDicomDateTime, updateNewInstanceMetadata } from './updateNewInstanceMetadata';
import { getSeriesDateTime } from './seriesDateTime';

describe('getCurrentDicomDateTime', () => {
  test('formats a date as DICOM DA and TM values', () => {
    expect(getCurrentDicomDateTime(new Date(2026, 7, 9, 4, 5, 6, 70))).toEqual({
      date: '20260809',
      time: '040506.070000',
    });
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
});
