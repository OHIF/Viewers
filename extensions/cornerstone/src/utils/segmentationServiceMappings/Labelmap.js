import { Enums as csToolsEnums } from '@cornerstonejs/tools';

const Labelmap = {
  toSegmentation: segmentationState => {
    const {
      activeSegmentIndex,
      cachedStats: data,
      segmentsLocked,
      representationData,
      label,
      segmentationId,
      text,
    } = segmentationState;

    const labelmapRepresentationData =
      representationData[csToolsEnums.SegmentationRepresentations.Labelmap];

    return {
      id: segmentationId,
      activeSegmentIndex,
      segmentsLocked,
      data,
      label,
      volumeId: labelmapRepresentationData.volumeId,
      displayText: text || [],
    };
  },
};

export default Labelmap;
