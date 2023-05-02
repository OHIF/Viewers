import createSeriesMetadata from './createSeriesMetadata';

function createStudyMetadata(StudyInstanceUID) {
  return {
    StudyInstanceUID,
    StudyDescription: '',
    ModalitiesInStudy: [],
    isLoaded: false,
    series: [],
    /**
     *
     * @param {object} instance
     * @returns {bool} true if series were added; false if series already exist
     */
    addInstanceToSeries: function(instance) {
      const { SeriesInstanceUID } = instance;
      if (!this.StudyDescription) {
        this.StudyDescription = instance.StudyDescription;
      }
      const existingSeries = this.series.find(
        s => s.SeriesInstanceUID === SeriesInstanceUID
      );

      if (existingSeries) {
        existingSeries.instances.push(instance);
      } else {
        const series = createSeriesMetadata([instance]);
        this.series.push(series);
        const { Modality } = series;
        if (this.ModalitiesInStudy.indexOf(Modality) === -1) {
          this.ModalitiesInStudy.push(Modality);
        }
      }
    },
    /**
     *
     * @param {object[]} instances
     * @param {string} instances[].SeriesInstanceUID
     * @param {string} instances[].StudyDescription
     * @returns {bool} true if series were added; false if series already exist
     */
    addInstancesToSeries: function(instances) {
      const { SeriesInstanceUID } = instances[0];
      if (!this.StudyDescription) {
        this.StudyDescription = instances[0].StudyDescription;
      }
      const existingSeries = this.series.find(
        s => s.SeriesInstanceUID === SeriesInstanceUID
      );

      if (existingSeries) {
        // Only add instances not already present, so generate a map
        // of existing instances and filter the to add by things
        // already present.
        const sopMap = {};
        existingSeries.instances.forEach(
          it => (sopMap[it.SOPInstanceUID] = it)
        );
        const newInstances = instances.filter(it => !sopMap[it.SOPInstanceUID]);
        existingSeries.instances.push(...newInstances);
      } else {
        const series = createSeriesMetadata(instances);
        this.series.push(series);
      }
    },

    setSeriesMetadata: function(SeriesInstanceUID, seriesMetadata) {
      let existingSeries = this.series.find(
        s => s.SeriesInstanceUID === SeriesInstanceUID
      );

      if (existingSeries) {
        existingSeries = Object.assign(existingSeries, seriesMetadata);
      } else {
        this.series.push(Object.assign({ instances: [] }, seriesMetadata));
      }
    },
  };
}

export default createStudyMetadata;
