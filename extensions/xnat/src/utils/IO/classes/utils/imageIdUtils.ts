// Helper to find imageId and display set info using the older OHIF-XNAT approach
export function getImageIdAndDisplaySetInfo(sopInstanceUID, frameNumber, seriesUID, displaySetService, extensionManager) {
  try {
    // Get all display sets for the series
    const displaySets = displaySetService.getDisplaySetsForSeries(seriesUID);

    if (!displaySets || displaySets.length === 0) {
      console.warn(`No display sets found for series ${seriesUID}`);
      return { imageId: null, displaySetInstanceUID: null };
    }
    
    // Find the display set that contains this SOPInstanceUID
    let matchingDisplaySet = null;
    let matchingImage = null;

    for (const displaySet of displaySets) {
      // Try the old approach first: look in displaySet.images
      if (displaySet.images && displaySet.images.length > 0) {
        matchingImage = displaySet.images.find(image =>
          image.SOPInstanceUID === sopInstanceUID
        );
        if (matchingImage) {
          matchingDisplaySet = displaySet;
          break;
        }
      }

      // Fallback to new approach: look in displaySet.instances
      if (!matchingImage && displaySet.instances && displaySet.instances.length > 0) {
        const matchingInstance = displaySet.instances.find(instance =>
          instance.SOPInstanceUID === sopInstanceUID
        );
        if (matchingInstance) {
          // Convert instance to image-like object for compatibility
          matchingImage = matchingInstance;
          matchingDisplaySet = displaySet;
          break;
        }
      }
    }

    if (!matchingDisplaySet || !matchingImage) {
      console.warn(`No display set found containing SOPInstanceUID ${sopInstanceUID}`);
      return { imageId: null, displaySetInstanceUID: null };
    }

    let imageId = null;

    // Check if this is a multi-frame instance
    const numberOfFrames = matchingImage.NumberOfFrames || matchingDisplaySet.numImageFrames || 1;
    const isMultiFrame = numberOfFrames > 1;

    // Use the old approach: try to get imageId from the image object
    if (matchingImage.getImageId && typeof matchingImage.getImageId === 'function') {
      try {
        imageId = matchingImage.getImageId();

        // Add frame parameter for multi-frame instances (using 0-based frame index)
        if (isMultiFrame && frameNumber > 1) {
          const frameIndex = frameNumber - 1; // Convert 1-based to 0-based
          imageId += `?frame=${frameIndex}`;
        }
      } catch (err) {
        console.warn('Failed to get imageId from getImageId():', err);
        imageId = null;
      }
    }

    // Fallback: use imageId property directly
    if (!imageId && matchingImage.imageId) {
      imageId = matchingImage.imageId;

      // Add frame parameter for multi-frame instances
      if (isMultiFrame && frameNumber > 1) {
        const frameIndex = frameNumber - 1; // Convert 1-based to 0-based
        const frameParam = imageId.includes('?') ? `&frame=${frameIndex}` : `?frame=${frameIndex}`;
        imageId += frameParam;
      }
    }

    // Last resort: construct imageId using data source (new approach)
    if (!imageId) {
      try {
        const dataSource = extensionManager?.getActiveDataSource?.()?.[0];
        if (dataSource && typeof dataSource.getImageIdsForInstance === 'function') {
          const frameParam = isMultiFrame && frameNumber > 1 ? frameNumber - 1 : undefined;
          imageId = dataSource.getImageIdsForInstance({
            instance: matchingImage,
            frame: frameParam
          });
        }
      } catch (err) {
        console.warn('Failed to get imageId from dataSource:', err);
      }
    }

    // Final fallback: construct a basic imageId
    if (!imageId) {
      if (isMultiFrame) {
        imageId = `wadors:${sopInstanceUID}:${frameNumber || 1}`;
      } else {
        imageId = `wadors:${sopInstanceUID}`;
      }
    }

    return {
      imageId,
      displaySetInstanceUID: matchingDisplaySet.displaySetInstanceUID
    };

  } catch (error) {
    console.error('Error getting imageId for SOPInstanceUID:', sopInstanceUID, error);
    return { imageId: null, displaySetInstanceUID: null };
  }
} 