import cornerstoneMath from "cornerstone-math";
import cornerstone from "cornerstone-core";

export default function getExtentOfSphere(
  currentImageIdIndex,
  points,
  image,
  imageIds
) {
  const { width, height, columnPixelSpacing, rowPixelSpacing } = image;
  const { start, end } = points;
  // Radius in mm.
  const radiusInMM = cornerstoneMath.point.distance(
    { x: start.x * columnPixelSpacing, y: start.y * rowPixelSpacing },
    { x: end.x * columnPixelSpacing, y: end.y * rowPixelSpacing }
  );

  const imagePlaneModules = [];

  imageIds.forEach(imageId => {
    const imagePlaneModule = cornerstone.metaData.get(
      "imagePlaneModule",
      imageId
    );

    imagePlaneModules.push(imagePlaneModule);
  });

  let topImageIdIndex = currentImageIdIndex;
  let bottomImageIdIndex = currentImageIdIndex;

  if (imagePlaneModules[currentImageIdIndex].imagePositionPatient) {
    const currentFrameIpp =
      imagePlaneModules[currentImageIdIndex].imagePositionPatient;
    const Vector3 = cornerstoneMath.Vector3;

    const currentFrameIppVec3 = new Vector3(
      currentFrameIpp[0],
      currentFrameIpp[1],
      currentFrameIpp[2]
    );

    for (let i = currentImageIdIndex + 1; i < imageIds.length; i++) {
      let ipp = {};

      [ipp.x, ipp.y, ipp.z] = imagePlaneModules[i].imagePositionPatient;

      const distance = currentFrameIppVec3.distanceTo(ipp);

      if (distance > radiusInMM) {
        break;
      }

      topImageIdIndex = i;
    }

    for (let i = currentImageIdIndex - 1; i >= 0; i--) {
      let ipp = {};

      [ipp.x, ipp.y, ipp.z] = imagePlaneModules[i].imagePositionPatient;

      const distance = currentFrameIppVec3.distanceTo(ipp);

      if (distance > radiusInMM) {
        break;
      }

      bottomImageIdIndex = i;
    }
  } else {
    // If no metadata, fallback to using all slices.
    bottomImageIdIndex = 0;
    topImageIdIndex = imageIds.length - 1;
  }

  // Radius in voxel space.
  const radius = Math.round(cornerstoneMath.point.distance(start, end));

  const radiusCeil = Math.ceil(radius);

  const topLeft = {
    x: Math.max(Math.round(start.x) - radiusCeil, 0),
    y: Math.max(Math.round(start.y) - radiusCeil, 0)
  };

  const bottomRight = {
    x: Math.min(Math.round(start.x) + radiusCeil, width),
    y: Math.min(Math.round(start.y) + radiusCeil, height)
  };

  const numFrames = topImageIdIndex - bottomImageIdIndex + 1;

  // Calculate where the current image from the full stack sits within this subvolume.
  let currentSubVolumeIndex = bottomImageIdIndex;

  for (let i = 0; i < numFrames; i++) {
    if (currentSubVolumeIndex === currentImageIdIndex) {
      currentSubVolumeIndex = i;
      break;
    }

    currentSubVolumeIndex++;
  }

  const subVolumeWidth = bottomRight.x - topLeft.x;
  const subVolumeHeight = bottomRight.y - topLeft.y;

  return {
    topImageIdIndex,
    bottomImageIdIndex,
    topLeft,
    bottomRight,
    numFrames,
    width: subVolumeWidth,
    height: subVolumeHeight,
    arrayLength: subVolumeWidth * subVolumeHeight * numFrames,
    currentSubVolumeIndex
  };
}
