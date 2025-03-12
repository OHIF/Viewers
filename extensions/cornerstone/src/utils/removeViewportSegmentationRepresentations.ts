import { segmentation } from '@cornerstonejs/tools';

function removeViewportSegmentationRepresentations(viewportId) {
  const representations = segmentation.state.getSegmentationRepresentations(viewportId);

  if (!representations || !representations.length) {
    return;
  }

  representations.forEach(representation => {
    segmentation.state.removeSegmentationRepresentation(
      representation.segmentationRepresentationUID
    );
  });
}

export default removeViewportSegmentationRepresentations;
