import { showLabelAnnotationPopup } from './callInputDialog';

function promptLabelAnnotation({ servicesManager }, ctx, evt) {
  const { measurementService, customizationService, toolGroupService } = servicesManager.services;
  const { viewportId, StudyInstanceUID, SeriesInstanceUID, measurementId, toolName } = evt;
  return new Promise(async function (resolve) {
    const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);
    const activeToolOptions = toolGroup.getToolConfiguration(toolName);
    if(activeToolOptions.getTextCallback) {
      resolve({
        StudyInstanceUID,
        SeriesInstanceUID,
        viewportId,
      })
    } else {
      const labelConfig = customizationService.getCustomization('measurementLabels');
      const measurement = measurementService.getMeasurement(measurementId);
      const renderContent = customizationService.getCustomization('ui.labellingComponent');
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
    }
  });
}

export default promptLabelAnnotation;
