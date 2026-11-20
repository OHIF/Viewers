import { utilities as csUtils } from '@cornerstonejs/core';
import type { Types } from '@cornerstonejs/core';
import { forEachVoxelInRegions, type ROIThresholdRegion } from './roiThresholdRegions';

/**
 * The highest PT value in the regions, over the labelmap voxels that `isFree` accepts,
 * so a voxel that another segment owns does not set the threshold.
 */
function getRegionMax(
  regions: ROIThresholdRegion[],
  labelmapVolume: Types.IImageVolume,
  isFree: (index: number) => boolean,
  ptVolume: Types.IImageVolume
): number {
  const { imageData, voxelManager } = ptVolume;
  let max = -Infinity;

  forEachVoxelInRegions(regions, labelmapVolume, (index, _ijk, pointLPS) => {
    if (!isFree(index)) {
      return;
    }
    const value = voxelManager.getAtIJKPoint(
      csUtils.transformWorldToIndex(imageData, pointLPS) as Types.Point3
    ) as number;
    if (value > max) {
      max = value;
    }
  });

  return max;
}

function getThresholdValues(
  regions: ROIThresholdRegion[],
  labelmapVolume: Types.IImageVolume,
  isFree: (index: number) => boolean,
  ptVolume: Types.IImageVolume,
  config
): { ptLower: number; ptUpper: number; ctLower: number; ctUpper: number } {
  if (config.strategy === 'range') {
    return {
      ptLower: Number(config.ptLower),
      ptUpper: Number(config.ptUpper),
      ctLower: Number(config.ctLower),
      ctUpper: Number(config.ctUpper),
    };
  }

  const ptValue = getRegionMax(regions, labelmapVolume, isFree, ptVolume);

  return {
    ctLower: -Infinity,
    ctUpper: +Infinity,
    ptLower: config.weight * ptValue,
    ptUpper: +Infinity,
  };
}

export default getThresholdValues;
