class SeriesMetadata {
  constructor(instances) {
    const { SeriesInstanceUID } = instances[0];
    this.SeriesInstanceUID = SeriesInstanceUID;
    this.instances = instances;
  }
}

export default SeriesMetadata;
