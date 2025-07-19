import { vec3 } from 'gl-matrix';
import isLowPriorityModality from './isLowPriorityModality';
import calculateScanAxisNormal from './calculateScanAxisNormal';
import areAllImageOrientationsEqual from './areAllImageOrientationsEqual';

const compareSeriesDateTime = (a, b) => {
  const seriesDateA = Date.parse(`${a.seriesDate ?? a.SeriesDate} ${a.seriesTime ?? a.SeriesTime}`);
  const seriesDateB = Date.parse(`${b.seriesDate ?? b.SeriesDate} ${b.seriesTime ?? b.SeriesTime}`);
  return seriesDateA - seriesDateB;
};

const defaultSeriesSort = (a, b) => {
  const seriesNumberA = a.SeriesNumber ?? a.seriesNumber;
  const seriesNumberB = b.SeriesNumber ?? b.seriesNumber;
  if (seriesNumberA === seriesNumberB) {
    return compareSeriesDateTime(a, b);
  }
  return seriesNumberA - seriesNumberB;
};

/**
 * Series sorting criteria: series considered low priority are moved to the end
 * of the list and series number is used to break ties
 * @param {Object} firstSeries
 * @param {Object} secondSeries
 */
function seriesInfoSortingCriteria(firstSeries, secondSeries) {
  const aLowPriority = isLowPriorityModality(firstSeries.Modality ?? firstSeries.modality);
  const bLowPriority = isLowPriorityModality(secondSeries.Modality ?? secondSeries.modality);

  if (aLowPriority) {
    // Use the reverse sort order for low priority modalities so that the
    // most recent one comes up first as usually that is the one of interest.
    return bLowPriority ? defaultSeriesSort(secondSeries, firstSeries) : 1;
  } else if (bLowPriority) {
    return -1;
  }

  return defaultSeriesSort(firstSeries, secondSeries);
}

const seriesSortCriteria = {
  default: seriesInfoSortingCriteria,
  seriesInfoSortingCriteria,
};

const sortByInstanceNumber = (a, b) => {
  // Sort by InstanceNumber (0020,0013)
  const aInstance = parseInt(a.InstanceNumber) || 0;
  const bInstance = parseInt(b.InstanceNumber) || 0;
  if (aInstance !== bInstance) {
    return (parseInt(a.InstanceNumber) || 0) - (parseInt(b.InstanceNumber) || 0);
  }
  // Fallback rule to enable consistent sorting
  if (a.SOPInstanceUID === b.SOPInstanceUID) {
    return 0;
  }
  return a.SOPInstanceUID < b.SOPInstanceUID ? -1 : 1;
};

const instancesSortCriteria = {
  default: sortByInstanceNumber,
  sortByInstanceNumber,
};

const sortingCriteria = {
  seriesSortCriteria,
  instancesSortCriteria,
};

/**
 * Sorts given series (given param is modified)
 * The default criteria is based on series number in ascending order.
 *
 * @param {Array} series List of series
 * @param {function} seriesSortingCriteria method for sorting
 * @returns {Array} sorted series object
 */
const sortStudySeries = (
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
const sortStudyInstances = (
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
export default function sortStudy(
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

function isValidForPositionSort(images): boolean {
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
const sortImagesByPatientPosition = images => {
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

export {
  sortStudy,
  sortStudySeries,
  sortStudyInstances,
  sortingCriteria,
  seriesSortCriteria,
  instancesSortCriteria,
  isValidForPositionSort,
  sortImagesByPatientPosition,
};
