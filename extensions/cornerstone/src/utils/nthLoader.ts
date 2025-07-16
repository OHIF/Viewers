import { cache, imageLoadPoolManager, Enums } from '@cornerstonejs/core';
import getNthFrames from './getNthFrames';
import interleave from './interleave';

// Map of volumeId and SeriesInstanceId
const volumeIdMapsToLoad = new Map<string, string>();
const viewportIdVolumeInputArrayMap = new Map<string, unknown[]>();

/**
 * This function caches the volumeUIDs until all the volumes inside the
 * hanging protocol are initialized. Then it goes through the requests and
 * chooses a sub-selection starting the the first few objects, center objects
 * and last objects, and then the remaining nth images until all instances are
 * retrieved.  This causes the image to have a progressive load order and looks
 * visually much better.
 * @param {Object} props image loading properties from Cornerstone ViewportService
 */
export default function interleaveNthLoader({
  data: { viewportId, volumeInputArray },
  displaySetsMatchDetails,
}) {
  viewportIdVolumeInputArrayMap.set(viewportId, volumeInputArray);

  // Based on the volumeInputs store the volumeIds and SeriesInstanceIds
  // to keep track of the volumes being loaded
  for (const volumeInput of volumeInputArray) {
    const { volumeId } = volumeInput;
    const volume = cache.getVolume(volumeId);

    if (!volume) {
      console.log("interleaveNthLoader::No volume, can't load it");
      return;
    }

    // if the volumeUID is not in the volumeUIDs array, add it
    if (!volumeIdMapsToLoad.has(volumeId)) {
      const { metadata } = volume;
      volumeIdMapsToLoad.set(volumeId, metadata.SeriesInstanceUID);
    }
  }

  const volumeIds = Array.from(volumeIdMapsToLoad.keys()).slice();
  // get volumes from cache
  const volumes = volumeIds.map(volumeId => {
    return cache.getVolume(volumeId);
  });

  // iterate over all volumes, and get their imageIds, and interleave
  // the imageIds and save them in AllRequests for later use
  const originalRequests = volumes
    .map(volume => volume.getImageLoadRequests?.() ?? [])
    .filter(requests => requests?.[0]?.imageId);

  const orderedRequests = originalRequests.map(request => getNthFrames(request));

  // set the finalRequests to the imageLoadPoolManager
  const finalRequests = interleave(orderedRequests);

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
