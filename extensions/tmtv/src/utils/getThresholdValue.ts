import * as csTools from '@cornerstonejs/tools';

function getThresholdValues(
  annotationUIDs,
  referencedVolume,
  config
): { lower: number; upper: number } {
  if (config.strategy === 'range') {
    return {
      lower: Number(config.lower),
      upper: Number(config.upper),
    };
  }

  // roiStats
  const { weight } = config;
  const { imageData } = referencedVolume;
  const values = imageData
    .getPointData()
    .getScalars()
    .getData();

  // Todo: add support for other strategies
  const { fn, baseValue } = _getStrategyFn('max');
  let value = baseValue;

  const annotations = annotationUIDs.map(annotationUID =>
    csTools.annotation.state.getAnnotation(annotationUID)
  );

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

  return {
    lower: weight * value,
    upper: +Infinity,
  };
}

function _getStrategyFn(
  statistic
): { fn: (a: number, b: number) => number; baseValue: number } {
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
