import { cache } from '@cornerstonejs/core';
import * as csTools from '@cornerstonejs/tools';

function getRoiStats(displaySet, annotations) {
  const { imageIds } = displaySet;

  const ptVolumeInfo = cache.getVolumeContainingImageId(imageIds[0]);

  if (!ptVolumeInfo) {
    throw new Error('No volume found for display set');
  }

  const { volume } = ptVolumeInfo;
  const { voxelManager } = volume;

  // Todo: add support for other strategies
  const { fn, baseValue } = _getStrategyFn('max');
  let value = baseValue;

  const boundsIJK = csTools.utilities.rectangleROITool.getBoundsIJKFromRectangleAnnotations(
    annotations,
    volume
  );

  // Use the voxelManager's forEach method to iterate over the bounds
  voxelManager.forEach(
    ({ value: voxelValue }) => {
      value = fn(voxelValue, value);
    },
    {
      boundsIJK,
    }
  );

  return value;
}

function getThresholdValues(
  annotationUIDs,
  ptDisplaySet,
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

  const { weight } = config;
  const annotations = annotationUIDs.map(annotationUID =>
    csTools.annotation.state.getAnnotation(annotationUID)
  );

  const ptValue = getRoiStats(ptDisplaySet, annotations);

  return {
    ctLower: -Infinity,
    ctUpper: +Infinity,
    ptLower: weight * ptValue,
    ptUpper: +Infinity,
  };
}

function _getStrategyFn(statistic): {
  fn: (a: number, b: number) => number;
  baseValue: number;
} {
  const baseValue = -Infinity;
  const fn = (number, maxValue) => {
    if (number > maxValue) {
      maxValue = number;
    }
    return maxValue;
  };
  return { fn, baseValue };
}

export default getThresholdValues;
