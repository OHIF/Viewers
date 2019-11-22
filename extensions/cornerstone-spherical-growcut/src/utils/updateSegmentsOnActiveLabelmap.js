import cornerstoneTools from "cornerstone-tools";

const segmentationModule = cornerstoneTools.getModule("segmentation");

export default function updateSegmentsOnActiveLabelmap(eventData, extent) {
  const { getters, setters } = segmentationModule;
  const { image, element } = eventData;
  const { labelmap3D } = getters.labelmap2D(element);
  const { width, height } = image;

  for (
    let imageIdIndex = extent.bottomImageIdIndex;
    imageIdIndex <= extent.topImageIdIndex;
    imageIdIndex++
  ) {
    const labelmap2D = getters.labelmap2DByImageIdIndex(
      labelmap3D,
      imageIdIndex,
      height,
      width
    );

    setters.updateSegmentsOnLabelmap2D(labelmap2D);
  }
}
