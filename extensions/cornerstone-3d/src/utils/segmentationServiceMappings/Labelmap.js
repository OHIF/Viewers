import { cache, getEnabledElement } from '@cornerstonejs/core';
import { segmentation } from '@cornerstonejs/tools';

const getDisplayTextFromCachedStats = stats => {
  let displayText = [];

  if (stats.suvPeak) {
    displayText.push(`SUV Peak: ${stats.suvPeak.toFixed(2)}`);
  }

  return displayText;
};

const Labelmap = {
  toSegmentation: (segmentation, DisplaySetService) => {
    const {
      activeSegmentIndex,
      element,
      labelmapIndex,
      labelmapUID,
    } = segmentation;

    debugger;

    return {};

    const globalState = SegmentationModule.getGlobalStateForLabelmapUID(
      labelmapUID
    );

    const { label, cachedStats } = globalState;

    if (!labelmapUID) {
      console.warn('No labelmapUID found');
      return null;
    }

    const volume = getVolume(labelmapUID);

    if (!volume) {
      throw new Error(`No volume found for labelmapUID: ${labelmapUID}`);
    }

    const { viewport } = getEnabledElement(element);
    const { dimensions, sizeInBytes, metadata } = volume;

    const displayText = getDisplayTextFromCachedStats(cachedStats);

    return {
      id: labelmapUID,
      label,
      labelmapIndex,
      activeLabelmapIndex,
      dimensions,
      sizeInBytes,
      cachedStats,
      FrameOfReferenceUID: viewport.getFrameOfReferenceUID(),
      // referenceSeriesUID: SeriesInstanceUID,
      // referenceStudyUID: StudyInstanceUID,
      // displaySetInstanceUID: displaySet.displaySetInstanceUID,
      type: 'Labelmap',
      displayText,
      metadata,
    };
  },
};

export default Labelmap;
