import { chartHandler } from './chartSOPClassHandler';

const chartInstance = (overrides = {}) => ({
  Modality: 'CHT',
  SOPClassUID: '1.9.451.13215.7.3.2.7.6.1',
  StudyInstanceUID: '1.2.3',
  SeriesInstanceUID: '1.2.3.4',
  SOPInstanceUID: '1.2.3.4.1',
  SeriesDescription: 'Chart',
  SeriesNumber: 99,
  SeriesDate: '20260817',
  SeriesTime: '133000',
  ...overrides,
});

describe('chartHandler', () => {
  // The series sort compares `SeriesDate SeriesTime` as a single string, so a
  // display set without a time cannot be placed among the other series.
  it('carries the series date and time of its instance', () => {
    const [displaySet] = chartHandler.getDisplaySetsFromSeries([chartInstance()]);

    expect(displaySet.SeriesDate).toBe('20260817');
    expect(displaySet.SeriesTime).toBe('133000');
  });

  it('reports an empty date and time rather than undefined', () => {
    const [displaySet] = chartHandler.getDisplaySetsFromSeries([
      chartInstance({ SeriesDate: undefined, SeriesTime: undefined }),
    ]);

    expect(displaySet.SeriesDate).toBe('');
    expect(displaySet.SeriesTime).toBe('');
  });

  // The date/time of the display set is the latest one the instance carries,
  // which for an instance added to an existing series is the instance level one
  // rather than the series one.
  it('takes the instance date and time over an older series one', () => {
    const [displaySet] = chartHandler.getDisplaySetsFromSeries([
      chartInstance({ ContentDate: '20260819', ContentTime: '080000' }),
    ]);

    expect(displaySet.SeriesDate).toBe('20260819');
    expect(displaySet.SeriesTime).toBe('080000');
  });
});
