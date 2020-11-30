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
      // Skip series that may not have instances yet
      // This can happen if we have retrieved just the initial
      // details about the series via QIDO-RS, but not the full metadata
      if (!series || series.getInstanceCount() === 0) {
        return;
      }

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
  const SOPClassUID = firstInstance.getData().metadata.SOPClassUID;

  return supportedSopClassUIDs.includes(SOPClassUID);
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
    series1._data.SeriesDate > series2._data.SeriesDate ||
    (series1._data.SeriesDate === series2._data.SeriesDate &&
      series1._data.SeriesTime > series2._data.SeriesTime)
  );
};

export default findMostRecentStructuredReport;
