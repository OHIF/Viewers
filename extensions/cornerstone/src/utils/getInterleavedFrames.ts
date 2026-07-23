interface ImageIdToPrefetch {
  imageId: string;
  imageIdIndex: number;
}

export default function getInterleavedFrames(imageIds: string[]): ImageIdToPrefetch[] {
  if (imageIds.length === 0) {
    return [];
  }

  if (imageIds.length === 1) {
    return [{ imageId: imageIds[0], imageIdIndex: 0 }];
  }

  const minImageIdIndex = 0;
  const maxImageIdIndex = imageIds.length - 1;

  const middleImageIdIndex = Math.floor(imageIds.length / 2);

  let lowerImageIdIndex = middleImageIdIndex;
  let upperImageIdIndex = middleImageIdIndex;

  // Build up an array of images to prefetch, starting with the current image.
  const imageIdsToPrefetch: ImageIdToPrefetch[] = [
    { imageId: imageIds[middleImageIdIndex], imageIdIndex: middleImageIdIndex },
  ];

  const prefetchQueuedFilled = {
    currentPositionDownToMinimum: false,
    currentPositionUpToMaximum: false,
  };

  // Check if on edges and some criteria is already fulfilled

  if (middleImageIdIndex === minImageIdIndex) {
    prefetchQueuedFilled.currentPositionDownToMinimum = true;
  } else if (middleImageIdIndex === maxImageIdIndex) {
    prefetchQueuedFilled.currentPositionUpToMaximum = true;
  }

  while (
    !prefetchQueuedFilled.currentPositionDownToMinimum ||
    !prefetchQueuedFilled.currentPositionUpToMaximum
  ) {
    if (!prefetchQueuedFilled.currentPositionDownToMinimum) {
      // Add imageId below
      lowerImageIdIndex--;
      imageIdsToPrefetch.push({
        imageId: imageIds[lowerImageIdIndex],
        imageIdIndex: lowerImageIdIndex,
      });

      if (lowerImageIdIndex === minImageIdIndex) {
        prefetchQueuedFilled.currentPositionDownToMinimum = true;
      }
    }

    if (!prefetchQueuedFilled.currentPositionUpToMaximum) {
      // Add imageId above
      upperImageIdIndex++;
      imageIdsToPrefetch.push({
        imageId: imageIds[upperImageIdIndex],
        imageIdIndex: upperImageIdIndex,
      });

      if (upperImageIdIndex === maxImageIdIndex) {
        prefetchQueuedFilled.currentPositionUpToMaximum = true;
      }
    }
  }

  return imageIdsToPrefetch;
}
