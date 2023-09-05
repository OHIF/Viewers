import { cache, imageLoadPoolManager, Enums } from '@cornerstonejs/core';
import { compact, flatten, zip } from 'lodash';

// Map of volumeId and SeriesInstanceId
const volumeIdMapsToLoad = new Map<string, string>();
const viewportIdVolumeInputArrayMap = new Map<string, unknown[]>();

/**
 * This function caches the volumeIds until all the volumes inside the
 * hanging protocol are initialized. Then it goes through the imageIds
 * of the volumes, and interleave them, in order for the volumes to be loaded
 * together from middle to the start and the end.
 * @param {Object} {viewportData, displaySetMatchDetails}
 * @returns
 */
export default function interleaveTopToBottom({
  data: { viewportId, volumeInputArray },
  displaySetsMatchDetails,
  viewportMatchDetails: matchDetails,
}) {
  viewportIdVolumeInputArrayMap.set(viewportId, volumeInputArray);

  // Based on the volumeInputs store the volumeIds and SeriesInstanceIds
  // to keep track of the volumes being loaded
  for (const volumeInput of volumeInputArray) {
    const { volumeId } = volumeInput;
    const volume = cache.getVolume(volumeId);

    if (!volume) {
      return;
    }

    // if the volumeUID is not in the volumeUIDs array, add it
    if (!volumeIdMapsToLoad.has(volumeId)) {
      const { metadata } = volume;
      volumeIdMapsToLoad.set(volumeId, metadata.SeriesInstanceUID);
    }
  }

  /**
   * The following is checking if all the viewports that were matched in the HP has been
   * successfully created their cornerstone viewport or not. Todo: This can be
   * improved by not checking it, and as soon as the matched DisplaySets have their
   * volume loaded, we start the loading, but that comes at the cost of viewports
   * not being created yet (e.g., in a 10 viewport ptCT fusion, when one ct viewport and one
   * pt viewport are created we have a guarantee that the volumes are created in the cache
   * but the rest of the viewports (fusion, mip etc.) are not created yet. So
   * we can't initiate setting the volumes for those viewports. One solution can be
   * to add an event when a viewport is created (not enabled element event) and then
   * listen to it and as the other viewports are created we can set the volumes for them
   * since volumes are already started loading.
   */
  if (matchDetails.size !== viewportIdVolumeInputArrayMap.size) {
    return;
  }

  // Check if all the matched volumes are loaded
  for (const [_, details] of displaySetsMatchDetails.entries()) {
    const { SeriesInstanceUID } = details;

    // HangingProtocol has matched, but don't have all the volumes created yet, so return
    if (!Array.from(volumeIdMapsToLoad.values()).includes(SeriesInstanceUID)) {
      return;
    }
  }

  const volumeIds = Array.from(volumeIdMapsToLoad.keys()).slice();
  // get volumes from cache
  const volumes = volumeIds.map(volumeId => {
    return cache.getVolume(volumeId);
  });

  // iterate over all volumes, and get their imageIds, and interleave
  // the imageIds and save them in AllRequests for later use
  const AllRequests = [];
  volumes.forEach(volume => {
    const requests = volume.getImageLoadRequests();

    if (!requests.length || !requests[0] || !requests[0].imageId) {
      return;
    }

    // reverse the requests
    AllRequests.push(requests.reverse());
  });

  // flatten the AllRequests array, which will result in a list of all the
  // imageIds for all the volumes but interleaved
  const interleavedRequests = compact(flatten(zip(...AllRequests)));

  // set the finalRequests to the imageLoadPoolManager
  const finalRequests = [];
  interleavedRequests.forEach(request => {
    const { imageId } = request;

    AllRequests.forEach(volumeRequests => {
      const volumeImageIdRequest = volumeRequests.find(req => req.imageId === imageId);
      if (volumeImageIdRequest) {
        finalRequests.push(volumeImageIdRequest);
      }
    });
  });

  const requestType = Enums.RequestType.Prefetch;
  const priority = 0;

  finalRequests.forEach(({ callLoadImage, additionalDetails, imageId, imageIdIndex, options }) => {
    const callLoadImageBound = callLoadImage.bind(null, imageId, imageIdIndex, options);

    imageLoadPoolManager.addRequest(callLoadImageBound, requestType, additionalDetails, priority);
  });

  // clear the volumeIdMapsToLoad
  volumeIdMapsToLoad.clear();

  // copy the viewportIdVolumeInputArrayMap
  const viewportIdVolumeInputArrayMapCopy = new Map(viewportIdVolumeInputArrayMap);

  // reset the viewportIdVolumeInputArrayMap
  viewportIdVolumeInputArrayMap.clear();

  return viewportIdVolumeInputArrayMapCopy;
}
