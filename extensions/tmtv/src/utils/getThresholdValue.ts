import * as csTools from '@cornerstonejs/tools';

function getRoiStats(referencedVolume, annotations) {
  // roiStats
  const { imageData } = referencedVolume;
  const values = imageData.getPointData().getScalars().getData();

  // Todo: add support for other strategies
  const { fn, baseValue } = _getStrategyFn('max');
  let value = baseValue;

  const boundsIJK = csTools.utilities.rectangleROITool.getBoundsIJKFromRectangleAnnotations(
    annotations,
    referencedVolume
  );

  const [[iMin, iMax], [jMin, jMax], [kMin, kMax]] = boundsIJK;

  for (let i = iMin; i <= iMax; i++) {
    for (let j = jMin; j <= jMax; j++) {
      for (let k = kMin; k <= kMax; k++) {
        const offset = imageData.computeOffsetIndex([i, j, k]);
        value = fn(values[offset], value);
      }
    }
  }
  return value;
}

function getThresholdValues(
  annotationUIDs,
  referencedVolumes,
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

  const ptValue = getRoiStats(referencedVolumes[0], annotations);

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
