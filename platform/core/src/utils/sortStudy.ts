import { vec3 } from 'gl-matrix';
import isLowPriorityModality from './isLowPriorityModality';
import calculateScanAxisNormal from './calculateScanAxisNormal';
import areAllImageOrientationsEqual from './areAllImageOrientationsEqual';
import { getDateTimeSortKey, getSeriesDateTimeSortKey } from './seriesDateTime';

export const compare = (a, b) => {
  if (a == b) return 0;
  if (!a && b) return -1;
  if (!b && a) return 1;
  if (a < b) return -1;
  return 1;
};

type CompareSameSeries = {
  priority: number;
  compare: (a, b) => number;
};

const mapCompareSameSeries = new Map<string, CompareSameSeries>();

/**
 * Adds a comparison for same series display sets.
 * Supply null for compareF to delete the function.
 */
export function addSameSeriesCompare(name: string, compareF: (a, b) => number, priority: number) {
  if (!compareF) {
    mapCompareSameSeries.delete(name);
  } else {
    mapCompareSameSeries.set(name, { compare: compareF, priority });
  }
}

/**
 * When the "series" sort is used on display sets, it is possible to get the
 * same series twice.  This method compares two display sets from the same series
 *
 * If both display sets have the same compareSameSeries name, then the
 * function registered for that name will be used.
 *
 * If they differ, then the priority between the two functions will be used.
 *
 * Otherwise, the instance compare will be used on the default instance.
 *
 * This provides a configurable well defined sorting order.
 */
export const compareSameSeriesDisplaySet = (a, b) => {
  const { compareSameSeries: compareAName = 'default' } = a;
  const { compareSameSeries: compareBName = 'default' } = b;
  const compareA = mapCompareSameSeries.get(compareAName);
  const compareB = mapCompareSameSeries.get(compareBName);
  if (compareA && compareB) {
    const compareValue =
      compareA === compareB
        ? compareA.compare(a, b)
        : compare(compareA.priority, compareB.priority);
    if (compareValue) {
      return compareValue;
    }
  }
  return sortByInstanceNumber(a.instance, b.instance);
};

export const compareSeriesUID = (a, b) =>
  compare(a.SeriesInstanceUID, b.SeriesInstanceUID) || compareSameSeriesDisplaySet(a, b);

/**
 * The date/time a display set is ordered by is the creation date/time of the
 * instance it shows, which the display set carries as `instance` - see
 * {@link getSeriesDateTime} for how that one date/time is chosen from the
 * attributes the instance has.  That is the only date/time which moves when a
 * report or segmentation is saved into an existing series, whose series
 * date/time remain those of the series as it was first created.
 *
 * A series, or a display set whose instance says nothing about when it was
 * created, has nothing but its series date/time and is ordered by that alone.
 */
export const dateTimeSortKey = source =>
  (source.instance && getSeriesDateTimeSortKey(source.instance)) ||
  getDateTimeSortKey(
    source.seriesDate ?? source.SeriesDate,
    source.seriesTime ?? source.SeriesTime
  );

/**
 * Compares by {@link dateTimeSortKey}, oldest first.  Sides with no date at all
 * sort as the oldest, and a date with no time sorts before the timed values of
 * that same date.
 */
export const compareSeriesDateTime = (a, b) =>
  compare(dateTimeSortKey(a), dateTimeSortKey(b)) || compareSeriesUID(a, b);

export const defaultSeriesSort = (a, b) => {
  const seriesNumberA = a.SeriesNumber ?? a.seriesNumber;
  const seriesNumberB = b.SeriesNumber ?? b.seriesNumber;
  return compare(seriesNumberA, seriesNumberB) || compareSeriesDateTime(a, b);
};

/**
 * Series sorting criteria: series considered low priority are moved to the end
 * of the list and series number is used to break ties
 * @param {Object} firstSeries
 * @param {Object} secondSeries
 */
export function seriesInfoSortingCriteria(firstSeries, secondSeries) {
  const aLowPriority = isLowPriorityModality(firstSeries.Modality ?? firstSeries.modality);
  const bLowPriority = isLowPriorityModality(secondSeries.Modality ?? secondSeries.modality);

  if (aLowPriority) {
    // Use the reverse sort order for low priority modalities so that the
    // most recent one comes up first as usually that is the one of interest.
    return bLowPriority ? compareSeriesDateTime(secondSeries, firstSeries) : 1;
  } else if (bLowPriority) {
    return -1;
  }

  return defaultSeriesSort(firstSeries, secondSeries);
}

export const seriesSortCriteria = {
  default: seriesInfoSortingCriteria,
  seriesInfoSortingCriteria,
  compareSameSeries: compareSameSeriesDisplaySet,
  compareSeriesDateTime,
  compareSeriesUID,
};

/**
 * Compares two instances first by instance number, then by when they were
 * created, and then by sop and frame numbers.
 * Handles undefined values for use with display set comparison.
 */
export const sortByInstanceNumber = (a, b) => {
  if (!a || !b) {
    // Two missing instances are equal.  The `||` chain this replaces treated a
    // 0 as "no answer" and fell through to -1, so a pair of display sets that
    // both lack an instance compared as -1 in both directions.
    if (!a && !b) {
      return 0;
    }
    return a ? 1 : -1;
  }
  const aInstance = parseInt(a.InstanceNumber) || 0;
  const bInstance = parseInt(b.InstanceNumber) || 0;
  if (aInstance !== bInstance) {
    return aInstance - bInstance;
  }
  // Two frames of one instance share every date/time that instance has, so only
  // the frame number orders them.  Excluding them first is also what keeps a
  // large multi frame series cheap to sort: its frames all carry the same
  // instance number, so every pair reaches this point.  Sources with no SOP
  // instance UID at all - display set view models, whose dates are formatted
  // for display rather than comparable - are likewise left as they came in.
  if (a.SOPInstanceUID === b.SOPInstanceUID) {
    return compare(a.frameNumber, b.frameNumber);
  }
  // The instance numbers do not order these two - they are the same, or neither
  // instance has one - so fall back to when each of them was created.  The last
  // instance of a series is taken to be the most recently created one, so an
  // instance number that fails to say which that is has to be replaced by
  // something that does.
  return (
    compare(getSeriesDateTimeSortKey(a), getSeriesDateTimeSortKey(b)) ||
    compare(a.SOPInstanceUID, b.SOPInstanceUID)
  );
};

export const instancesSortCriteria = {
  default: sortByInstanceNumber,
  sortByInstanceNumber,
};

export const sortingCriteria = {
  seriesSortCriteria,
  instancesSortCriteria,
};

export type SortDisplaySetsCopyOptions = {
  /**
   * Display sets for this study are sorted by series criteria and listed first;
   * all other display sets follow in their original relative order.
   */
  studyInstanceUIDFirst?: string;
  /** Defaults to {@link seriesSortCriteria.default} (not app customization). */
  seriesSortingCriteria?: (a, b) => number;
};

/**
 * Returns a new array of display sets sorted by default series order
 * ({@link seriesSortCriteria.default} / {@link seriesInfoSortingCriteria}), not
 * the app customization. Does not mutate the input.
 *
 * With `studyInstanceUIDFirst`, only that study's display sets are sorted; they
 * are placed before the rest, which keeps source order (e.g. load order).
 */
export function sortDisplaySetsCopy(displaySets, options?: SortDisplaySetsCopyOptions | null) {
  const seriesSortingCriteria = options?.seriesSortingCriteria ?? seriesSortCriteria.default;
  const studyFirst = options?.studyInstanceUIDFirst;

  if (!studyFirst) {
    return [...displaySets].sort(seriesSortingCriteria);
  }

  const sameStudy = [];
  const otherStudy = [];
  for (const ds of displaySets) {
    if (ds.StudyInstanceUID === studyFirst) {
      sameStudy.push(ds);
    } else {
      otherStudy.push(ds);
    }
  }
  return [...[...sameStudy].sort(seriesSortingCriteria), ...otherStudy];
}

/**
 * Sorts given series or display sets
 * The default criteria is based on series number in ascending order.
 *
 * @param series -  List of series (modified in place)
 * @param seriesSortingCriteria - method for sorting
 * @returns sorted series object
 */
export const sortStudySeries = (
  series,
  seriesSortingCriteria = seriesSortCriteria.default,
  sortFunction = null
) => {
  if (typeof sortFunction === 'function') {
    return sortFunction(series);
  } else {
    return series.sort(seriesSortingCriteria);
  }
};

/**
 * Sorts given instancesList (given param is modified)
 * The default criteria is based on instance number in ascending order.
 *
 * @param {Array} instancesList List of series
 * @param {function} instancesSortingCriteria method for sorting
 * @returns {Array} sorted instancesList object
 */
export const sortStudyInstances = (
  instancesList,
  instancesSortingCriteria = instancesSortCriteria.default
) => {
  return instancesList.sort(instancesSortingCriteria);
};

/**
 * Sorts the series and instances (by default) inside a study instance based on sortingCriteria (given param is modified)
 * The default criteria is based on series and instance numbers in ascending order.
 *
 * @param {Object} study The study instance
 * @param {boolean} [deepSort = true] to sort instance also
 * @param {function} [seriesSortingCriteria = seriesSortCriteria.default] method for sorting series
 * @param {function} [instancesSortingCriteria = instancesSortCriteria.default] method for sorting instances
 * @returns {Object} sorted study object
 */
export function sortStudy(
  study,
  deepSort = true,
  seriesSortingCriteria = seriesSortCriteria.default,
  instancesSortingCriteria = instancesSortCriteria.default
) {
  if (!study || !study.series) {
    throw new Error('Insufficient study data was provided to sortStudy');
  }

  sortStudySeries(study.series, seriesSortingCriteria);

  if (deepSort) {
    study.series.forEach(series => {
      sortStudyInstances(series.instances, instancesSortingCriteria);
    });
  }

  return study;
}

export function isValidForPositionSort(images): boolean {
  if (images.length <= 1) {
    return false; // No need to sort if there's only one image
  }

  // Use the first image as a reference
  const referenceImagePositionPatient = images[0].ImagePositionPatient;
  const imageOrientationPatient = images[0].ImageOrientationPatient;

  if (!referenceImagePositionPatient || !imageOrientationPatient) {
    return false;
  }

  if (!areAllImageOrientationsEqual(images)) {
    return false;
  }

  return true;
}

/**
 * Sort by image position, calculated using imageOrientationPatient and ImagePositionPatient
 * If imageOrientationPatient or ImagePositionPatient is not available, Images will be sorted by the provided sortingCriteria
 * Note: Images are sorted in-place and a reference to the sorted image array is returned.
 *
 * @returns images - reference to images after sorting
 */
export const sortImagesByPatientPosition = images => {
  const referenceImagePositionPatient = images[0].ImagePositionPatient;
  const imageOrientationPatient = images[0].ImageOrientationPatient;

  // Calculate the scan axis normal using the cross product
  const scanAxisNormal = calculateScanAxisNormal(imageOrientationPatient);

  // Compute distances from each image to the reference image
  const distanceInstancePairs = images.map(image => {
    const imagePositionPatient = image.ImagePositionPatient;
    const deltaVector = vec3.create();
    const distance = vec3.dot(
      scanAxisNormal,
      vec3.subtract(deltaVector, imagePositionPatient, referenceImagePositionPatient)
    );
    return { distance, image };
  });
  // Sort images based on the computed distances
  distanceInstancePairs.sort((a, b) => b.distance - a.distance);
  // Reorder the images in the original array
  for (const [index, item] of distanceInstancePairs.entries()) {
    images[index] = item.image;
  }

  return images;
};

export default sortStudy;
