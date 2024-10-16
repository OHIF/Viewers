import { showLabelAnnotationPopup } from './callInputDialog';

function promptLabelAnnotation({ servicesManager }, ctx, evt) {
  const { measurementService, customizationService } = servicesManager.services;
  const { viewportId, StudyInstanceUID, SeriesInstanceUID, measurementId } = evt;
  return new Promise(async function (resolve) {
    const labelConfig = customizationService.get('measurementLabels');
    const measurement = measurementService.getMeasurement(measurementId);
    const value = await showLabelAnnotationPopup(
      measurement,
      servicesManager.services.uiDialogService,
      labelConfig
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
