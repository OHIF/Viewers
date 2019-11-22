import cornerstoneTools from "cornerstone-tools";

const { getToolState } = cornerstoneTools;
const segmentationModule = cornerstoneTools.getModule("segmentation");

export default function deleteLabelmap(element, labelmapIndex) {
  if (!element) {
    return;
  }

  const { state } = segmentationModule;

  const stackState = getToolState(element, "stack");
  const stackData = stackState.data[0];
  const firstImageId = stackData.imageIds[0];

  const brushStackState = state.series[firstImageId];

  console.log(brushStackState);

  delete brushStackState.labelmaps3D[labelmapIndex];

  if (brushStackState.activeLabelmapIndex === labelmapIndex) {
    brushStackState.activeLabelmapIndex = 0;
  }
}
