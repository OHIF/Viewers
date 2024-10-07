export function getViewportPresentations(
  servicesManager: AppTypes.ServicesManager,
  viewportOptions: AppTypes.ViewportGrid.GridViewportOptions
) {
  const { stateSyncService } = servicesManager.services;
  const state = stateSyncService.getState();
  const { lutPresentationStore, positionPresentationStore, segmentationPresentationStore } = state;
  const { presentationIds } = viewportOptions;

  return {
    positionPresentation: positionPresentationStore[presentationIds?.positionPresentationId],
    lutPresentation: lutPresentationStore[presentationIds?.lutPresentationId],
    segmentationPresentation:
      segmentationPresentationStore[presentationIds?.segmentationPresentationId],
  };
}
