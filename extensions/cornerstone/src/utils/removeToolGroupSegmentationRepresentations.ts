import { segmentation } from '@cornerstonejs/tools';

function removeToolGroupSegmentationRepresentations(toolGroupId) {
  const representations = segmentation.state.getSegmentationRepresentations(toolGroupId);

  if (!representations || !representations.length) {
    return;
  }

  representations.forEach(representation => {
    segmentation.state.removeSegmentationRepresentation(
      toolGroupId,
      representation.segmentationRepresentationUID
    );
  });
}

export default removeToolGroupSegmentationRepresentations;
