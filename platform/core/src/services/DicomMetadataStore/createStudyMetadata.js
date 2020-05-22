import createSeriesMetadata from './createSeriesMetadata';

function createStudyMetadata(StudyInstanceUID) {
  return {
    StudyInstanceUID,
    series: [],
    addSeries: function(instances) {
      const series = createSeriesMetadata(instances);
      this.series.push(series);
    },
  };
}

export default createStudyMetadata;
