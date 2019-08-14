/**
 * Sorts the series and instances inside a study instance by their series
 * and instance numbers in ascending order.
 *
 * @param {Object} study The study instance
 */
export default function sortStudy(study) {
  if (!study || !study.seriesList) {
    throw new Error('Insufficient study data was provided to sortStudy');
  }

  study.seriesList.sort((a, b) => a.seriesNumber - b.seriesNumber);

  study.seriesList.forEach(series => {
    series.instances.sort((a, b) => a.instanceNumber - b.instanceNumber);
  });
}
