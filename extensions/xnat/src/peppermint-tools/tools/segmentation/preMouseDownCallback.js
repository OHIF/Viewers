import generateSegmentationMetadata from '../../utils/generateSegmentationMetadata';
import csTools from 'cornerstone-tools';

const triggerEvent = csTools.importInternal('util/triggerEvent');
const segmentationModule = csTools.getModule('segmentation');

export default function preMouseDownCallback(element) {
  const {
    labelmap3D,
    currentImageIdIndex,
    activeLabelmapIndex,
  } = segmentationModule.getters.labelmap2D(element);

  console.log({
    SphericaMouseDown: segmentationModule.getters.labelmap2D(element),
  });

  let segmentIndex = labelmap3D.activeSegmentIndex;
  let metadata = labelmap3D.metadata[segmentIndex];

  console.log({ metadata, segmentIndex });

  if (!metadata) {
    metadata = generateSegmentationMetadata('Unnamed Segment');

    segmentIndex = labelmap3D.activeSegmentIndex = 1;

    segmentationModule.setters.metadata(
      element,
      activeLabelmapIndex,
      segmentIndex,
      metadata
    );

    triggerEvent(element, 'peppermintautosegmentgenerationevent', {});
  }
}
