import * as cornerstone from '@cornerstonejs/core';

/**
 * It checks if the imageId is provided then it uses it to query
 * the metadata and get the SOPInstanceUID, SeriesInstanceUID and StudyInstanceUID.
 * If the imageId is not provided then it uses the sceneUID to get the viewports
 * inside the scene and then it checks each viewport to find the one that has
 * acquisition plane view, and uses the currentImageId of the viewport to
 * query the metadata and get UIDs.
 * @param {string} imageId The image id of the referenced image
 * @param {string} sceneUID The scene UID of the measurement tool
 * @returns
 */
export default function getSOPInstanceAttributes(
  imageId,
  cornerstoneViewportService = undefined,
  viewportId = undefined
) {
  if (imageId) {
    return _getUIDFromImageID(imageId);
  }

  // Todo: implement for volume viewports and use the referencedSeriesInstanceUID

  // if no imageId => measurement is not in the acquisition plane
  // const metadata = getUIDFromScene(cornerstoneViewportService, viewportId);

  // if (!metadata) {
  //   throw new Error('Not viewport with imageId found');
  // }

  // // Since the series and study UID is derived from another viewport in the
  // // same scene, we cannot include the SOPInstanceUID
  // return {
  //   SOPInstanceUID: null,
  //   SeriesInstanceUID: metadata.SeriesInstanceUID,
  //   StudyInstanceUID: metadata.StudyInstanceUID,
  // };
}

function _getUIDFromImageID(imageId) {
  const instance = cornerstone.metaData.get('instance', imageId);

  return {
    SOPInstanceUID: instance.SOPInstanceUID,
    SeriesInstanceUID: instance.SeriesInstanceUID,
    StudyInstanceUID: instance.StudyInstanceUID,
    frameNumber: instance.frameNumber || 1,
  };
}

// function getUIDFromScene(cornerstoneViewportService) {
//   const renderingEngine = cornerstoneViewportService.getRenderingEngine();
//   const scene = renderingEngine.getScene(sceneUID);

//   const viewportUIDs = scene.getViewportIds();

//   if (viewportUIDs.length === 0) {
//     throw new Error('No viewport found in scene');
//   }

//   for (let i = 0; i < viewportUIDs.length; i++) {
//     const vp = renderingEngine.getViewport(viewportUIDs[i]);
//     const imageId = vp.getCurrentImageId();

//     if (imageId) {
//       return _getUIDFromImageID(imageId);
//     }
//   }
// }
