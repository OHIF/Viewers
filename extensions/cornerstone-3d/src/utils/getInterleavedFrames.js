export default function getInterleavedFrames(imageIds) {
  const minImageIdIndex = 0;
  const maxImageIdIndex = imageIds.length - 1;

  const middleImageIdIndex = Math.floor(imageIds.length / 2);

  let lowerImageIdIndex = middleImageIdIndex;
  let upperImageIdIndex = middleImageIdIndex;

  // Build up an array of images to prefetch, starting with the current image.
  const imageIdsToPrefetch = [
    { imageId: imageIds[middleImageIdIndex], imageIdIndex: middleImageIdIndex },
  ];

  // 0: From current stack position down to minimum.
  // 1: From current stack position up to maximum.

  const prefetchQueuedFilled = [false, false];

  // Check if on edges and some criteria is already fulfilled

  if (middleImageIdIndex === minImageIdIndex) {
    prefetchQueuedFilled[0] = true;
  } else if (middleImageIdIndex === maxImageIdIndex) {
    prefetchQueuedFilled[1] = true;
  }

  while (!prefetchQueuedFilled[0] || !prefetchQueuedFilled[1]) {
    if (!prefetchQueuedFilled[0]) {
      // Add imageId bellow
      lowerImageIdIndex--;
      imageIdsToPrefetch.push({
        imageId: imageIds[lowerImageIdIndex],
        imageIdIndex: lowerImageIdIndex,
      });

      if (lowerImageIdIndex === minImageIdIndex) {
        prefetchQueuedFilled[0] = true;
      }
    }

    if (!prefetchQueuedFilled[1]) {
      // Add imageId above
      upperImageIdIndex++;
      imageIdsToPrefetch.push({
        imageId: imageIds[upperImageIdIndex],
        imageIdIndex: upperImageIdIndex,
      });

      if (upperImageIdIndex === maxImageIdIndex) {
        prefetchQueuedFilled[1] = true;
      }
    }
  }

  return imageIdsToPrefetch;
}
