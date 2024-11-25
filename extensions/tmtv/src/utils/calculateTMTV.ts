import { Types } from '@cornerstonejs/core';
import { utilities } from '@cornerstonejs/tools';

/**
 * Given a list of labelmaps (with the possibility of overlapping regions),
 * and a referenceVolume, it calculates the total metabolic tumor volume (TMTV)
 * by flattening and rasterizing each segment into a single labelmap and summing
 * the total number of volume voxels. It should be noted that for this calculation
 * we do not double count voxels that are part of multiple labelmaps.
 * @param {} labelmaps
 * @param {number} segmentIndex
 * @returns {number} TMTV in ml
 */
function calculateTMTV(labelmaps: Array<Types.IImageVolume>, segmentIndex = 1): number {
  const volumeId = 'mergedLabelmap';

  const mergedLabelmap = utilities.segmentation.createMergedLabelmapForIndex(
    labelmaps,
    segmentIndex,
    volumeId
  );

  const { imageData, spacing, voxelManager } = mergedLabelmap;

  // count non-zero values inside the outputData, this would
  // consider the overlapping regions to be only counted once
  let numVoxels = 0;
  const callback = ({ value }) => {
    if (value > 0) {
      numVoxels += 1;
    }
  };

  voxelManager.forEach(callback, {
    imageData,
    isInObject: () => true,
  });

  return 1e-3 * numVoxels * spacing[0] * spacing[1] * spacing[2];
}

export default calculateTMTV;
