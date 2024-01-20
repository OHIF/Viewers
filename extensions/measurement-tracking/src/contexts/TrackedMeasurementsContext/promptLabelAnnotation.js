function promptLabelAnnotation({ servicesManager, extensionManager }, ctx, evt) {
  const { measurementService } = servicesManager.services;
  const { viewportId, StudyInstanceUID, SeriesInstanceUID, measurementId } = evt;
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.common'
  );
  const { showLabelAnnotationPopup } = utilityModule.exports;
  return new Promise(async function (resolve) {
    const modeLabelConfig = measurementService.getLabelConfig();
    const measurement = measurementService.getMeasurement(measurementId);
    const value = await showLabelAnnotationPopup(
      measurement,
      servicesManager.services.uiDialogService,
      modeLabelConfig
    );

    measurementService.update(
      measurementId,
      {
        ...value,
      },
      true
    );

    resolve({
      StudyInstanceUID,
      SeriesInstanceUID,
      viewportId,
    });
  });
}

export default promptLabelAnnotation;
