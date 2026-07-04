import { useViewportGrid } from '@ohif/ui-next';
import { useViewportSegmentations } from './useViewportSegmentations';

function useActiveViewportSegmentationRepresentations() {
  const viewportId = useViewportGrid(state => state.activeViewportId);

  const segmentations = useViewportSegmentations({ viewportId });

  return segmentations;
}

export { useActiveViewportSegmentationRepresentations };
