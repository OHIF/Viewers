import { showLabelAnnotationPopup } from './callInputDialog';

function promptLabelAnnotation({ servicesManager }, ctx, evt) {
  const { measurementService, customizationService } = servicesManager.services;
  const { viewportId, StudyInstanceUID, SeriesInstanceUID, measurementId } = evt;
  return new Promise(async function (resolve) {
    const labelConfig = customizationService.getCustomization('measurementLabels');
    const renderContent = customizationService.getCustomization('ui.labellingComponent');
    const measurement = measurementService.getMeasurement(measurementId);
    const value = await showLabelAnnotationPopup(
      measurement,
      servicesManager.services.uiDialogService,
      labelConfig,
      renderContent
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
