export function getViewportPresentations(
  servicesManager: AppTypes.ServicesManager,
  viewportOptions: AppTypes.ViewportGrid.GridViewportOptions
) {
  const { stateSyncService } = servicesManager.services;

  const state = stateSyncService.getState();
  const { lutPresentationStore, positionPresentationStore, segmentationPresentationStore } = state;

  // NOTE: this is the new viewport state, we should not get the presentationIds from the cornerstoneViewportService
  // since that has the old viewport state
  const { presentationIds } = viewportOptions;

  if (!presentationIds) {
    return {
      positionPresentation: null,
      lutPresentation: null,
      segmentationPresentation: null,
    };
  }
  const { lutPresentationId, positionPresentationId, segmentationPresentationId } = presentationIds;
  const positionPresentation = positionPresentationStore[positionPresentationId];
  const lutPresentation = lutPresentationStore[lutPresentationId];
  const segmentationPresentation = segmentationPresentationStore[segmentationPresentationId];

  return {
    positionPresentation,
    lutPresentation: lutPresentationStore[lutPresentationId],
    segmentationPresentation: segmentationPresentationStore[segmentationPresentationId],
  };
}
