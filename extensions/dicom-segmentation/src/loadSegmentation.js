import dcmjs from 'dcmjs';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';

export default async function loadSegmentation(
  imageIds,
  segDisplaySet,
  labelmapBuffer,
  segMetadata,
  segmentsOnFrame,
  labelmapSegments
) {
  const { setters } = cornerstoneTools.getModule('segmentation');

  // TODO: Could define a color LUT based on colors in the SEG.
  const labelmapIndex = _getNextLabelmapIndex(imageIds[0]);
  const colorLUTIndex = _makeColorLUTAndGetIndex(segMetadata);

  setters.labelmap3DByFirstImageId(
    imageIds[0],
    labelmapBuffer,
    labelmapIndex,
    segMetadata,
    imageIds.length,
    segmentsOnFrame,
    colorLUTIndex
  );

  if (!segDisplaySet.labelmapSegments) {
    segDisplaySet.labelmapSegments = {};
  }

  /**
   * Cache each labelmap segments.
   * This data is used to determine the active label map when a given segment is activated/clicked.
   */
  segDisplaySet.labelmapSegments[labelmapIndex] = labelmapSegments.length
    ? Array.from(
        new Set(labelmapSegments.filter(a => !!a).reduce((a, b) => a.concat(b)))
      )
    : [];
  segDisplaySet.labelmapIndex = labelmapIndex;

  /*
   * TODO: Improve the way we notify parts of the app that depends on segs to be loaded.
   *
   * Currently we are using a non-ideal implementation through a custom event to notify the segmentation panel
   * or other components that could rely on loaded segmentations that
   * the segments were loaded so that e.g. when the user opens the panel
   * before the segments are fully loaded, the panel can subscribe to this custom event
   * and update itself with the new segments.
   *
   * This limitation is due to the fact that the cs segmentation module is an object (which will be
   * updated after the segments are loaded) that React its not aware of its changes
   * because the module object its not passed in to the panel component as prop but accessed externally.
   *
   * Improving this event approach to something reactive that can be tracked inside the react lifecycle,
   * allows us to easily watch the module or the segmentations loading process in any other component
   * without subscribing to external events.
   */
  console.log('Segmentation loaded.');
  const event = new CustomEvent('extensiondicomsegmentationsegloaded', {
    detail: {
      imageIds,
      segDisplaySet,
      labelmapBuffer,
      segMetadata,
      segmentsOnFrame,
      labelmapSegments,
    },
  });
  document.dispatchEvent(event);

  return labelmapIndex;
}

function _getNextLabelmapIndex(firstImageId) {
  const { state } = cornerstoneTools.getModule('segmentation');
  const brushStackState = state.series[firstImageId];

  let labelmapIndex = 0;

  if (brushStackState) {
    const { labelmaps3D } = brushStackState;
    labelmapIndex = labelmaps3D.length;

    for (let i = 0; i < labelmaps3D.length; i++) {
      if (!labelmaps3D[i]) {
        labelmapIndex = i;
        break;
      }
    }
  }

  return labelmapIndex;
}

function _makeColorLUTAndGetIndex(segMetadata) {
  const { setters, state } = cornerstoneTools.getModule('segmentation');
  const { colorLutTables } = state;
  const colorLUTIndex = _getNextColorLUTIndex();

  const { data } = segMetadata;

  if (
    !data.some(
      segment =>
        segment &&
        (segment.ROIDisplayColor || segment.RecommendedDisplayCIELabValue)
    )
  ) {
    // Use default cornerstoneTools colorLUT.
    return 0;
  }

  const colorLUT = [];

  for (let i = 0; i < data.length; i++) {
    const segment = data[i];
    if (!segment) {
      continue;
    }

    const { ROIDisplayColor, RecommendedDisplayCIELabValue } = segment;

    if (RecommendedDisplayCIELabValue) {
      const rgb = dcmjs.data.Colors.dicomlab2RGB(
        RecommendedDisplayCIELabValue
      ).map(x => Math.round(x * 255));

      colorLUT[i] = [...rgb, 255];
    } else if (ROIDisplayColor) {
      colorLUT[i] = [...ROIDisplayColor, 255];
    } else {
      colorLUT[i] = [...colorLutTables[0][i]];
    }
  }

  colorLUT.shift();
  setters.colorLUT(colorLUTIndex, colorLUT);

  return colorLUTIndex;
}

function _getNextColorLUTIndex() {
  const { state } = cornerstoneTools.getModule('segmentation');
  const { colorLutTables } = state;

  let colorLUTIndex = colorLutTables.length;

  for (let i = 0; i < colorLutTables.length; i++) {
    if (!colorLutTables[i]) {
      colorLUTIndex = i;
      break;
    }
  }

  return colorLUTIndex;
}
