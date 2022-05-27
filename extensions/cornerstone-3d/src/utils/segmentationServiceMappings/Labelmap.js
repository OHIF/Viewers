import { segmentation, Enums as csToolsEnums } from '@cornerstonejs/tools';

const getDisplayTextFromCachedStats = stats => {
  let displayText = [];

  if (stats.suvPeak) {
    displayText.push(`SUV Peak: ${stats.suvPeak.toFixed(2)}`);
  }

  return displayText;
};

const Labelmap = {
  toSegmentation: segmentationState => {
    const {
      activeSegmentIndex,
      cachedStats: data,
      segmentsLocked,
      representationData,
      label,
      segmentationId,
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
      displayText: getDisplayTextFromCachedStats(data),
    };
  },
};

export default Labelmap;
