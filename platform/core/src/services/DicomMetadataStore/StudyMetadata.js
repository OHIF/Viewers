import SeriesMetadata from './SeriesMetadata';

class StudyMetadata {
  constructor(StudyInstanceUID) {
    this.StudyInstanceUID = StudyInstanceUID;
    this.series = [];
  }

  addSeries(instances) {
    this.series.push(new SeriesMetadata(instances));
  }
}

export default StudyMetadata;
