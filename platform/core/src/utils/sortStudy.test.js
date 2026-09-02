import {
  compareSeriesUID,
  compareSeriesDateTime,
  addSameSeriesCompare,
  compare,
  seriesInfoSortingCriteria,
  sortByInstanceNumber,
} from './sortStudy';

addSameSeriesCompare('default', (a, b) => compare(a.default, b.default), 5);
const altCompare = 'altCompare';
addSameSeriesCompare(altCompare, (a, b) => compare(a.altCompare, b.altCompare), 3);

const ds1 = {
  name: 'ds1',
  SeriesInstanceUID: '1',
  default: 'ds1',
};

const ds2 = {
  ...ds1,
  name: 'ds2',
  default: 'ds2',
};

const ds3 = {
  ...ds2,
  name: 'ds3',
  altCompare: 3,
  compareSameSeries: altCompare,
};

const ds4 = {
  ...ds1,
  name: 'ds4',
  altCompare: 4,
  compareSameSeries: altCompare,
};

const ds5 = {
  ...ds1,
  name: 'ds5',
  SeriesInstanceUID: '3',
};

const names = displaySets => displaySets.map(displaySet => displaySet.name);

describe('sortStudy', () => {
  // Display sets using different compare functions are ordered by the priority
  // those functions were registered with, lowest first, so the two altCompare
  // (3) display sets precede the two default (5) ones.  Within one compare
  // function that function decides.  ds5 is a different series entirely.
  const expected = ['ds3', 'ds4', 'ds1', 'ds2', 'ds5'];

  test('compareSameSeries', () => {
    expect(names([ds5, ds4, ds3, ds2, ds1].sort(compareSeriesUID))).toEqual(expected);
  });

  test('compareSameSeries does not depend on the starting order', () => {
    expect(names([ds1, ds2, ds3, ds4, ds5].sort(compareSeriesUID))).toEqual(expected);
    expect(names([ds3, ds5, ds1, ds4, ds2].sort(compareSeriesUID))).toEqual(expected);
  });

  test('falls back to the instance compare when the series has no compare registered', () => {
    const noCompare = { SeriesInstanceUID: '9', compareSameSeries: 'unregistered' };
    const second = { ...noCompare, name: 'second', instance: { InstanceNumber: 2 } };
    const first = { ...noCompare, name: 'first', instance: { InstanceNumber: 1 } };

    expect(names([second, first].sort(compareSeriesUID))).toEqual(['first', 'second']);
  });

  test('same series display sets that both lack an instance compare as equal', () => {
    const a = { SeriesInstanceUID: '9', compareSameSeries: 'unregistered' };
    const b = { SeriesInstanceUID: '9', compareSameSeries: 'unregistered' };

    expect(compareSeriesUID(a, b)).toBe(0);
    expect(compareSeriesUID(b, a)).toBe(0);
  });
});

describe('compare', () => {
  // An inconsistent comparator - both directions answering with the same sign -
  // makes Array.prototype.sort produce an order that depends on the starting
  // order, so every pair has to compare symmetrically.  That includes values
  // that arrive as both a number and a string, as DICOM integer strings do.
  test.each([
    ['a number and the same value as a string', 1, '1'],
    ['undefined and null', undefined, null],
    ['zero and an empty string', 0, ''],
    ['two different values', '20260817', '20260101'],
  ])('is symmetric for %s', (_name, a, b) => {
    expect(compare(a, b) + compare(b, a)).toBe(0);
  });
});

describe('sortByInstanceNumber', () => {
  const instance = { InstanceNumber: 1, SOPInstanceUID: '1.2.3.1' };

  test('two missing instances are equal', () => {
    expect(sortByInstanceNumber(undefined, undefined)).toBe(0);
  });

  test('a missing instance sorts first', () => {
    expect(sortByInstanceNumber(undefined, instance)).toBe(-1);
    expect(sortByInstanceNumber(instance, undefined)).toBe(1);
  });

  test('orders by instance number, then sop instance uid, then frame number', () => {
    expect(sortByInstanceNumber(instance, { ...instance, InstanceNumber: 2 })).toBe(-1);
    expect(sortByInstanceNumber(instance, { ...instance, SOPInstanceUID: '1.2.3.2' })).toBe(-1);
    expect(
      sortByInstanceNumber({ ...instance, frameNumber: 1 }, { ...instance, frameNumber: 2 })
    ).toBe(-1);
  });

  // The last instance of a series is taken to be the most recently created one,
  // so instance numbers that do not say which that is have to give way to the
  // creation date/time - but only then, as the instance number is the default.
  test('falls back to the creation date time when the instance numbers tie', () => {
    // The sop instance uids order the other way round, so only the date decides.
    const older = { ...instance, SOPInstanceUID: '1.2.3.2', ContentDate: '20260817' };
    const newer = { ...instance, SOPInstanceUID: '1.2.3.1', ContentDate: '20260819' };

    expect(sortByInstanceNumber(older, newer)).toBe(-1);
    expect(sortByInstanceNumber(newer, older)).toBe(1);
  });

  test('the instance number decides before the creation date time', () => {
    const first = { ...instance, InstanceNumber: 1, ContentDate: '20260819' };
    const second = { ...instance, InstanceNumber: 2, ContentDate: '20260817' };

    expect(sortByInstanceNumber(first, second)).toBe(-1);
  });
});

describe('compareSeriesDateTime', () => {
  const series = (name, attributes) => ({
    name,
    SeriesInstanceUID: `1.2.3.${name}`,
    ...attributes,
  });

  // Every instance of a series carries that series' date and time, so a report
  // saved into an existing series has the date and time of the series as it was
  // first created.  Only the creation date/time of the instance the display set
  // shows says when the display set itself was created.
  test('orders display sets by the creation date time of their instance', () => {
    const sameSeries = { SeriesDate: '20260817', SeriesTime: '090000' };
    const sorted = [
      series('third', {
        ...sameSeries,
        instance: { ...sameSeries, ContentDate: '20260819', ContentTime: '080000' },
      }),
      series('first', { ...sameSeries, instance: { ...sameSeries } }),
      series('second', {
        ...sameSeries,
        instance: { ...sameSeries, ContentDate: '20260818', ContentTime: '235959' },
      }),
    ].sort(compareSeriesDateTime);

    expect(names(sorted)).toEqual(['first', 'second', 'third']);
  });

  // A list of series, as opposed to display sets, has no instance to look at
  // and is ordered by the series date and time alone.
  test('orders series with no instance by their series date and time', () => {
    const sorted = [
      series('c', { SeriesDate: '20260817', SeriesTime: '093000' }),
      series('a', { SeriesDate: '20260817', SeriesTime: '090000' }),
      series('b', { seriesDate: '20260817', seriesTime: '091500' }),
    ].sort(compareSeriesDateTime);

    expect(names(sorted)).toEqual(['a', 'b', 'c']);
  });

  test('falls back to the series date time when the instance has no date', () => {
    const sorted = [
      series('later', { SeriesDate: '20260818', instance: { SOPInstanceUID: '1.2.3.2' } }),
      series('earlier', { SeriesDate: '20260817', instance: { SOPInstanceUID: '1.2.3.1' } }),
    ].sort(compareSeriesDateTime);

    expect(names(sorted)).toEqual(['earlier', 'later']);
  });

  test('a series with no date at all sorts as the oldest', () => {
    const sorted = [series('dated', { SeriesDate: '20260817' }), series('undated', {})].sort(
      compareSeriesDateTime
    );

    expect(names(sorted)).toEqual(['undated', 'dated']);
  });

  test('is symmetric', () => {
    const a = series('a', { SeriesDate: '20260817', SeriesTime: '090000' });
    const b = series('b', { SeriesDate: '20260818' });

    expect(compareSeriesDateTime(a, b) + compareSeriesDateTime(b, a)).toBe(0);
  });
});

describe('seriesInfoSortingCriteria', () => {
  const derived = (Modality, SeriesInstanceUID, SeriesTime) => ({
    name: `${Modality} ${SeriesTime || 'no time'}`,
    Modality,
    SeriesInstanceUID,
    SeriesDate: '20260817',
    SeriesTime,
    instance: { InstanceNumber: 1, SOPInstanceUID: `${SeriesInstanceUID}.1` },
  });

  const image = {
    name: 'MR',
    Modality: 'MR',
    SeriesNumber: 5,
    SeriesInstanceUID: '1.2.3.5',
    SeriesDate: '20260101',
    SeriesTime: '101500',
    instance: { InstanceNumber: 1, SOPInstanceUID: '1.2.3.5.1' },
  };

  // Low priority modalities go after the images, most recent first, so a SEG and
  // an SR have to interleave by when they were created rather than clustering by
  // modality - which is what happens when one of them reports no series time.
  test('orders SEG and SR together, newest first, after the images', () => {
    const sorted = [
      derived('SR', '1.2.3.901', '090000'),
      derived('SEG', '1.2.3.802', '133000'),
      image,
      derived('SR', '1.2.3.903', '140000'),
      derived('SEG', '1.2.3.801', '093000'),
    ].sort(seriesInfoSortingCriteria);

    expect(names(sorted)).toEqual(['MR', 'SR 140000', 'SEG 133000', 'SEG 093000', 'SR 090000']);
  });

  test('sorts a derived series with no series time last within its date', () => {
    const sr = derived('SR', '1.2.3.901', '090000');
    const segNoTime = derived('SEG', '1.2.3.801', '');

    expect(names([segNoTime, sr].sort(seriesInfoSortingCriteria))).toEqual([
      'SR 090000',
      'SEG no time',
    ]);
  });
});
