const promptBeginTrackingWrapper = ({ servicesManager, extensionManager }, ctx, evt) => {
  const { customizationService } = servicesManager.services;
  const promptBeginTracking = customizationService.getCustomization(
    'measurement.promptBeginTracking'
  );
  return promptBeginTracking({ servicesManager, extensionManager }, ctx, evt);
};

const promptHydrateStructuredReportWrapper = (
  { servicesManager, extensionManager, commandsManager, appConfig },
  ctx,
  evt
) => {
  const { customizationService } = servicesManager.services;
  const promptHydrateStructuredReport = customizationService.getCustomization(
    'measurement.promptHydrateStructuredReport'
  );
  return promptHydrateStructuredReport(
    { servicesManager, extensionManager, commandsManager, appConfig },
    ctx,
    evt
  );
};

const promptTrackNewSeriesWrapper = ({ servicesManager, extensionManager }, ctx, evt) => {
  const { customizationService } = servicesManager.services;
  const promptTrackNewSeries = customizationService.getCustomization(
    'measurement.promptTrackNewSeries'
  );
  return promptTrackNewSeries({ servicesManager, extensionManager }, ctx, evt);
};

const promptTrackNewStudyWrapper = ({ servicesManager, extensionManager }, ctx, evt) => {
  const { customizationService } = servicesManager.services;
  const promptTrackNewStudy = customizationService.getCustomization(
    'measurement.promptTrackNewStudy'
  );
  return promptTrackNewStudy({ servicesManager, extensionManager }, ctx, evt);
};

const promptLabelAnnotationWrapper = ({ servicesManager }, ctx, evt) => {
  const { customizationService } = servicesManager.services;
  const promptLabelAnnotation = customizationService.getCustomization(
    'measurement.promptLabelAnnotation'
  );
  return promptLabelAnnotation({ servicesManager }, ctx, evt);
};

const promptSaveReportWrapper = (
  { servicesManager, commandsManager, extensionManager },
  ctx,
  evt
) => {
  const { customizationService } = servicesManager.services;
  const promptSaveReport = customizationService.getCustomization('measurement.promptSaveReport');
  return promptSaveReport({ servicesManager, commandsManager, extensionManager }, ctx, evt);
};

const promptHasDirtyAnnotationsWrapper = (
  { servicesManager, commandsManager, extensionManager },
  ctx,
  evt
) => {
  const { customizationService } = servicesManager.services;
  const promptHasDirtyAnnotations = customizationService.getCustomization(
    'measurement.promptHasDirtyAnnotations'
  );
  return promptHasDirtyAnnotations(
    { servicesManager, commandsManager, extensionManager },
    ctx,
    evt
  );
};

export {
  promptBeginTrackingWrapper,
  promptHydrateStructuredReportWrapper,
  promptTrackNewSeriesWrapper,
  promptTrackNewStudyWrapper,
  promptLabelAnnotationWrapper,
  promptSaveReportWrapper,
  promptHasDirtyAnnotationsWrapper,
};
