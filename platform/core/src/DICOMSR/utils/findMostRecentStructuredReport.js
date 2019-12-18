/**
 * Should find the most recent Structured Report metadata
 *
 * @param {Array} studies
 * @returns {Object} Series
 */
const findMostRecentStructuredReport = studies => {
  let mostRecentStructuredReport;

  studies.forEach(study => {
    const allSeries = study.getSeries ? study.getSeries() : [];
    allSeries.forEach(series => {
      if (isStructuredReportSeries(series)) {
        if (
          !mostRecentStructuredReport ||
          compareSeriesDate(series, mostRecentStructuredReport)
        ) {
          mostRecentStructuredReport = series;
        }
      }
    });
  });

  return mostRecentStructuredReport;
};

/**
 *  Checks if series sopClassUID matches with the supported Structured Reports sopClassUID
 *
 * @param {Object} series - Series metadata
 * @returns {boolean}
 */
const isStructuredReportSeries = series => {
  const supportedSopClassUIDs = [
    '1.2.840.10008.5.1.4.1.1.88.22',
    '1.2.840.10008.5.1.4.1.1.11.1',
  ];

  const firstInstance = series.getFirstInstance();
  const sopClassUid = firstInstance._instance.sopClassUid;

  return supportedSopClassUIDs.includes(sopClassUid);
};

/**
 *  Checkes if series1 is newer than series2
 *
 * @param {Object} series1 - Series Metadata 1
 * @param {Object} series2 - Series Metadata 2
 * @returns {boolean} true/false if series1 is newer than series2
 */
const compareSeriesDate = (series1, series2) => {
  return (
    series1._data.seriesDate > series2._data.seriesDate ||
    (series1._data.seriesDate === series2._data.seriesDate &&
      series1._data.seriesTime > series2._data.seriesTime)
  );
};

export default findMostRecentStructuredReport;
