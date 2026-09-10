import {
  compareSeriesUID,
  compareSeriesDateTime,
  addSameSeriesCompare,
  compare,
  defaultSeriesSort,
  seriesInfoSortingCriteria,
  sortByInstanceNumber,
} from './sortStudy';
import { getSeriesDateTime } from './seriesDateTime';

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

  // Every frame of a multi frame instance carries that instance's number and
  // its one creation date/time, so only the frame number can order them.  They
  // are also the pairs a large series is sorted by, so they are recognised by
  // their shared sop instance uid and never read a date/time at all.
  test('orders the frames of one instance by frame number', () => {
    const frames = [3, 1, 2].map(frameNumber => ({
      ...instance,
      frameNumber,
      ContentDate: '20260819',
      ContentTime: '080000',
    }));

    expect(frames.sort(sortByInstanceNumber).map(frame => frame.frameNumber)).toEqual([1, 2, 3]);
  });

  // The study browser sorts thumbnail view models, which carry no instance
  // number or sop instance uid to be ordered by and a date formatted for
  // display rather than a comparable one, so they keep the order they came in.
  test('leaves sources with no sop instance uid in the order given', () => {
    const thumbnails = [
      { name: 'b', seriesDate: '05-Feb-2026' },
      { name: 'a', seriesDate: '19-Jan-2026' },
    ];

    expect(names(thumbnails.sort(sortByInstanceNumber))).toEqual(['b', 'a']);
  });

  // An image series has a unique instance number on every instance, so the
  // creation date/time tie break never runs for one and the order is the
  // instance number order it has always been - here the acquisition times run
  // backwards, and the images still come out in instance number order.
  test('orders an image series by instance number alone', () => {
    const images = [
      { InstanceNumber: 3, SOPInstanceUID: '1.2.3.3', AcquisitionDateTime: '20260819080000' },
      { InstanceNumber: 1, SOPInstanceUID: '1.2.3.1', AcquisitionDateTime: '20260819080002' },
      { InstanceNumber: 2, SOPInstanceUID: '1.2.3.2', AcquisitionDateTime: '20260819080001' },
    ];

    expect([...images].sort(sortByInstanceNumber).map(image => image.InstanceNumber)).toEqual([
      1, 2, 3,
    ]);
  });
});

describe('compareSeriesDateTime', () => {
  const series = (name, attributes) => ({
    name,
    SeriesInstanceUID: `1.2.3.${name}`,
    ...attributes,
  });

  /**
   * A derived display set as a SOP class handler builds one: the display set
   * carries the date/time of the instance it shows, and the instance keeps the
   * series' own `SeriesDate`/`SeriesTime` unchanged.
   *
   * `SeriesInstanceUID` is given explicitly so that a test can order the uids
   * against the date/time it expects.  `compareSeriesDateTime` falls through to
   * the uid when the date/time tie, so a fixture whose uids already run in the
   * expected order passes whether the date/time decided anything or not.
   */
  const derived = (name, SeriesInstanceUID, seriesDateTime, instanceDateTime) => {
    const instance = { ...seriesDateTime, ...instanceDateTime };
    return {
      name,
      SeriesInstanceUID,
      instance,
      ...seriesDateTime,
      ...getSeriesDateTime(instance),
    };
  };

  const seriesDateTime = { SeriesDate: '20260817', SeriesTime: '090000' };

  // Every instance of a series carries that series' date and time, so a report
  // saved into an existing series has the date and time of the series as it was
  // first created.  The handler writes the creation date/time of the instance
  // the display set shows onto the display set, and that is what orders it.
  test('orders display sets by the date time the handler wrote from their instance', () => {
    // The uids run the other way round, so only the date/time can give this
    // order: on a tie the sort would answer third, second, first.
    const sorted = [
      derived('third', '1.2.3.1', seriesDateTime, {
        ContentDate: '20260819',
        ContentTime: '080000',
      }),
      derived('first', '1.2.3.3', seriesDateTime, {}),
      derived('second', '1.2.3.2', seriesDateTime, {
        ContentDate: '20260818',
        ContentTime: '235959',
      }),
    ].sort(compareSeriesDateTime);

    expect(names(sorted)).toEqual(['first', 'second', 'third']);
  });

  // A mammography, CR or DX series makes one display set per instance, and a
  // multi frame series one per multi frame instance.  Each of them carries the
  // series' own date and time, so they tie on the sort key and the same series
  // compare orders them - the instance date/time is never read here, because a
  // key that varies inside a series both hides the same series compare and
  // makes the comparator inconsistent.
  test('keeps the display sets of one split series together', () => {
    const split = (name, def, ContentTime) => ({
      name,
      SeriesInstanceUID: '1.2.3.A',
      default: def,
      ...seriesDateTime,
      instance: { ...seriesDateTime, ContentDate: '20260817', ContentTime },
    });
    // Series B falls between the two instances of series A by content time.
    const between = series('between', {
      SeriesDate: '20260817',
      SeriesTime: '091500',
      instance: { SeriesDate: '20260817', SeriesTime: '091500' },
    });

    const sorted = [split('a1', 'b', '090000'), split('a2', 'a', '093000'), between].sort(
      compareSeriesDateTime
    );

    expect(names(sorted)).toEqual(['a2', 'a1', 'between']);
  });

  // The cycle that a comparator using one key inside a series and another
  // between series produces: a1 < between < a2 by the instance date/time, while
  // the registered compare puts a2 before a1.  `sort` then answers differently
  // for each input order.  One key for both cases cannot produce a cycle.
  test('is transitive across a same series pair and a third series', () => {
    const a1 = {
      name: 'a1',
      SeriesInstanceUID: 'A',
      default: 'b',
      ...seriesDateTime,
      instance: { ContentDate: '20260817', ContentTime: '090000' },
    };
    const a2 = {
      name: 'a2',
      SeriesInstanceUID: 'A',
      default: 'a',
      ...seriesDateTime,
      instance: { ContentDate: '20260817', ContentTime: '093000' },
    };
    const b = {
      name: 'b',
      SeriesInstanceUID: 'B',
      SeriesDate: '20260817',
      SeriesTime: '091500',
      instance: { ContentDate: '20260817', ContentTime: '091500' },
    };

    expect(compareSeriesDateTime(a2, a1)).toBeLessThan(0);
    expect(compareSeriesDateTime(a1, b)).toBeLessThan(0);
    // a2 is before a1, and a1 is before b, so a2 has to be before b.
    expect(compareSeriesDateTime(a2, b)).toBeLessThan(0);
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

/**
 * A worked example proves one case.  These prove the property, over a pool that
 * holds every shape the sort has to deal with at once:
 *
 * - a split image series, whose display sets share the series' date/time and
 *   whose registered compare disagrees with the order of their instances;
 * - a second image series that shares the first one's `SeriesNumber`, so the
 *   pre-key of `defaultSeriesSort` decides nothing between the two;
 * - a derived series holding two display sets, one per save, with different
 *   display set date/times - what `DisplaySetService` builds for a second SEG
 *   saved into an existing SEG series;
 * - a derived series holding one display set, and one with no date at all.
 *
 * The pool is small enough to check every permutation, which is stronger than a
 * sample of shuffles and needs no seed to reproduce.
 */
describe('comparator consistency', () => {
  const splitImage = (name, def, ContentTime) => ({
    name,
    Modality: 'MG',
    SeriesNumber: 1,
    SeriesInstanceUID: 'A',
    // Written from the instance's own SeriesDate/SeriesTime, which every
    // instance of the series carries identically.
    SeriesDate: '20260817',
    SeriesTime: '090000',
    default: def,
    // The instance date/time interleave with the other image series, so a
    // comparator that reads them rather than the display set produces the
    // cycle these tests exist to catch.
    instance: {
      InstanceNumber: def === 'a' ? 2 : 1,
      SOPInstanceUID: `A.${def}`,
      ContentDate: '20260817',
      ContentTime,
    },
  });

  const otherImage = {
    name: 'ct',
    Modality: 'CT',
    SeriesNumber: 1,
    SeriesInstanceUID: 'B',
    SeriesDate: '20260817',
    SeriesTime: '091500',
    instance: {
      InstanceNumber: 1,
      SOPInstanceUID: 'B.1',
      ContentDate: '20260817',
      ContentTime: '091500',
    },
  };

  // Two saves into one SEG series: DisplaySetService gives each instance its
  // own display set, and each writes its own date/time.
  const segSave = (name, SeriesTime) => ({
    name,
    Modality: 'SEG',
    SeriesNumber: 99,
    SeriesInstanceUID: 'C',
    SeriesDate: '20260817',
    SeriesTime,
    instance: { InstanceNumber: 1, SOPInstanceUID: `C.${SeriesTime}` },
  });

  const sr = {
    name: 'sr',
    Modality: 'SR',
    SeriesNumber: 98,
    SeriesInstanceUID: 'D',
    SeriesDate: '20260817',
    SeriesTime: '140000',
    instance: { InstanceNumber: 1, SOPInstanceUID: 'D.1' },
  };

  const undated = {
    name: 'undated',
    Modality: 'SEG',
    SeriesNumber: 97,
    SeriesInstanceUID: 'E',
    instance: { InstanceNumber: 1, SOPInstanceUID: 'E.1' },
  };

  const pool = [
    splitImage('a1', 'b', '090000'),
    splitImage('a2', 'a', '093000'),
    otherImage,
    segSave('seg0930', '093000'),
    segSave('seg1330', '133000'),
    sr,
    undated,
  ];

  const permutations = items => {
    if (items.length <= 1) {
      return [items];
    }
    const result = [];
    items.forEach((item, index) => {
      const rest = [...items.slice(0, index), ...items.slice(index + 1)];
      permutations(rest).forEach(tail => result.push([item, ...tail]));
    });
    return result;
  };

  const sign = value => (value < 0 ? -1 : value > 0 ? 1 : 0);

  describe.each([
    ['compareSeriesDateTime', compareSeriesDateTime],
    ['compareSeriesUID', compareSeriesUID],
    ['defaultSeriesSort', defaultSeriesSort],
    ['seriesInfoSortingCriteria', seriesInfoSortingCriteria],
  ])('%s', (_name, compareF) => {
    test('answers with the opposite sign in the opposite direction', () => {
      const asymmetric = [];
      for (const x of pool) {
        for (const y of pool) {
          if (sign(compareF(x, y)) !== -sign(compareF(y, x))) {
            asymmetric.push(`${x.name},${y.name}`);
          }
        }
      }

      expect(asymmetric).toEqual([]);
    });

    test('is transitive', () => {
      const intransitive = [];
      for (const x of pool) {
        for (const y of pool) {
          if (compareF(x, y) > 0) {
            continue;
          }
          for (const z of pool) {
            if (compareF(y, z) <= 0 && compareF(x, z) > 0) {
              intransitive.push(`${x.name}<=${y.name}<=${z.name} but ${x.name}>${z.name}`);
            }
          }
        }
      }

      expect(intransitive).toEqual([]);
    });

    // What an inconsistent comparator costs the user: the series list depends
    // on the order the display sets arrived in.
    test('gives the same list whatever order the display sets arrive in', () => {
      const results = new Set(
        permutations(pool).map(input => names([...input].sort(compareF)).join(','))
      );

      expect([...results]).toHaveLength(1);
    });
  });

  // The two display sets of the split series keep the order their registered
  // compare gives them, and no display set of another series comes between
  // them, because they hold one date/time between them.
  test('keeps a split image series together and orders the derived series newest first', () => {
    expect(names([...pool].sort(seriesInfoSortingCriteria))).toEqual([
      'a2',
      'a1',
      'ct',
      'sr',
      'seg1330',
      'seg0930',
      'undated',
    ]);
  });
});
