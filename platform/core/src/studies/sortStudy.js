import getSeriesInfo from './getSeriesInfo';

/**
 * Series sorting criteria: series considered low priority are moved to the end
 * of the list and series number is used to break ties
 * @param {Object} firstSeries
 * @param {Object} secondSeries
 */
function seriesInfoSortingCriteria(firstSeries, secondSeries) {
  const a = getSeriesInfo(firstSeries);
  const b = getSeriesInfo(secondSeries);
  if (!a.isLowPriority && b.isLowPriority) {
    return -1;
  }
  if (a.isLowPriority && !b.isLowPriority) {
    return 1;
  }
  return a.SeriesNumber - b.SeriesNumber;
}

const seriesSortCriteria = {
  default: (a, b) => a.SeriesNumber - b.SeriesNumber,
  seriesInfoSortingCriteria,
};

const instancesSortCriteria = {
  default: (a, b) => a.InstanceNumber - b.InstanceNumber,
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
  seriesSortingCriteria = seriesSortCriteria.default
) => {
  return series.sort(seriesSortingCriteria);
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

export { sortStudySeries, sortStudyInstances, sortingCriteria };
