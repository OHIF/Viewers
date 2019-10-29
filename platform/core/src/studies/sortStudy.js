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
  return a.seriesNumber - b.seriesNumber;
}

const seriesSortCriteria = {
  default: ((a, b) => a.seriesNumber - b.seriesNumber),
  seriesInfoSortingCriteria
};

const instancesSortCriteria = {
  default: ((a, b) => a.instanceNumber - b.instanceNumber)
};

const sortingCriteria = {
  seriesSortCriteria,
  instancesSortCriteria
};

const sortStudySeries = (seriesList, seriesSortingCriteria = seriesSortCriteria.default) => {
  return seriesList.sort(seriesSortingCriteria);
};

const sortStudyInstances = (instancesList, instancesSortingCriteria = instancesSortCriteria.default) => {
  return instancesList.sort(instancesSortingCriteria);
};

/**
 * Sorts the series and instances inside a study instance by their series
 * and instance numbers in ascending order.
 *
 * @param {Object} study The study instance
 */
export default function sortStudy(study, deepSort = true, seriesSortingCriteria = seriesSortCriteria.default, instancesSortingCriteria = instancesSortCriteria.default) {
  if (!study || !study.seriesList) {
    throw new Error('Insufficient study data was provided to sortStudy');
  }

  sortStudySeries(study.seriesList, seriesSortingCriteria);

  if (deepSort) {
    study.seriesList.forEach(series => {
      sortStudyInstances(series.instances, instancesSortingCriteria);
    });
  }

  return study;
}

export {
  sortStudySeries,
  sortStudyInstances,
  sortingCriteria
}
