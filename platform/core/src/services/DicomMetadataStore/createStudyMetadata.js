import createSeriesMetadata from './createSeriesMetadata';

function createStudyMetadata(StudyInstanceUID) {
  return {
    StudyInstanceUID,
    series: [],
    /**
     *
     * @param {object[]} instances
     * @param {string} instances[].SeriesInstanceUID
     * @returns {bool} true if series were added; false if series already exist
     */
    addSeries: function (instances) {
      const { SeriesInstanceUID } = instances[0];
      const seriesExists = this.series.some(
        s => s.SeriesInstanceUID === SeriesInstanceUID
      );

      if (!seriesExists) {
        const series = createSeriesMetadata(instances);
        this.series.push(series);
      }

      return !seriesExists;
    },
  };
}

export default createStudyMetadata;
