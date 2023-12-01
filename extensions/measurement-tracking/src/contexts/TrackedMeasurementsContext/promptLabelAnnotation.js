function promptLabelAnnotation({ servicesManager }, ctx, evt) {
  const { measurementService } = servicesManager.services;
  const { viewportId, StudyInstanceUID, SeriesInstanceUID, measurementId } = evt;

  return new Promise(async function (resolve) {
    const modeLabelConfig = measurementService.getModeLabelConfing();
    if (modeLabelConfig && modeLabelConfig.labelOnMeasure === true) {
      await measurementService.labelAnnotation(
        measurementId,
        servicesManager
      );
    }

    resolve({
      StudyInstanceUID,
      SeriesInstanceUID,
      viewportId
    });
  });
}

export default promptLabelAnnotation;
