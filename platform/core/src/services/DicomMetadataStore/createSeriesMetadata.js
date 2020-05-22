function createSeriesMetadata(instances) {
  const { SeriesInstanceUID } = instances[0];

  return {
    SeriesInstanceUID,
    instances,
  };
}

export default createSeriesMetadata;
