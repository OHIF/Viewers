import { useViewportGrid } from '@ohif/ui-next';
import { useViewportSegmentations } from './useViewportSegmentations';

function useActiveViewportSegmentationRepresentations() {
  const [viewportGrid] = useViewportGrid();

  const viewportId = viewportGrid?.activeViewportId;

  const segmentations = useViewportSegmentations({ viewportId });

  return segmentations;
}

export { useActiveViewportSegmentationRepresentations };
