import SegmentationServiceType from '../services/SegmentationService';

export const handleSegmentChange = ({
  direction,
  segmentationId,
  viewportId,
  selectedSegmentObjectIndex,
  segmentationService,
}: {
  direction: number;
  segmentationId: string;
  viewportId: string;
  selectedSegmentObjectIndex: number;
  segmentationService: SegmentationServiceType;
}) => {
  const segmentation = segmentationService.getSegmentation(segmentationId);

  const { segments } = segmentation;

  const numberOfSegments = Object.keys(segments).length;

  // Get activeSegment each time because the user can select any segment from the list and thus the index should be updated
  const activeSegment = segmentationService.getActiveSegment(viewportId);
  if (activeSegment) {
    // from the activeSegment get the actual object array index to be used
    selectedSegmentObjectIndex = Object.values(segments).findIndex(
      segment => segment.segmentIndex === activeSegment.segmentIndex
    );
  }
  let newSelectedSegmentIndex = selectedSegmentObjectIndex + direction;

  // Handle looping through list of segments
  if (newSelectedSegmentIndex > numberOfSegments - 1) {
    newSelectedSegmentIndex = 0;
  } else if (newSelectedSegmentIndex < 0) {
    newSelectedSegmentIndex = numberOfSegments - 1;
  }

  // Convert segmentationId from object array index to property value of type Segment
  // Functions below use the segmentIndex object attribute so we have to do the conversion
  const segmentIndex = Object.values(segments)[newSelectedSegmentIndex]?.segmentIndex;

  segmentationService.setActiveSegment(segmentationId, segmentIndex);
  segmentationService.jumpToSegmentCenter(segmentationId, segmentIndex, viewportId);
  selectedSegmentObjectIndex = newSelectedSegmentIndex;
};
