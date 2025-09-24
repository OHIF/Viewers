import { usePositionPresentationStore } from '../../stores/usePositionPresentationStore';
import { useLutPresentationStore } from '../../stores/useLutPresentationStore';
import { useSegmentationPresentationStore } from '../../stores/useSegmentationPresentationStore';

export function getViewportPresentations(
  viewportId: string,
  viewportOptions: AppTypes.ViewportGrid.GridViewportOptions
) {
  const { lutPresentationStore } = useLutPresentationStore.getState();
  const { positionPresentationStore } = usePositionPresentationStore.getState();
  const { segmentationPresentationStore } = useSegmentationPresentationStore.getState();

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
    lutPresentation,
    segmentationPresentation,
  };
}
