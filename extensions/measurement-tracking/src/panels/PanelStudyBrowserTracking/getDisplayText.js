/**
 *
 * @param {*} measurement
 * @param {*} pixelSpacing
 * @param {*} seriesNumber
 * @param {*} instanceNumber
 * @param {*} types
 */
export default function _getDisplayText(
  measurement,
  pixelSpacing,
  seriesNumber,
  instanceNumber,
  types
) {
  const { type, points } = measurement;
  const hasPixelSpacing =
    pixelSpacing !== undefined &&
    Array.isArray(pixelSpacing) &&
    pixelSpacing.length === 2;
  const [rowPixelSpacing, colPixelSpacing] = hasPixelSpacing
    ? pixelSpacing
    : [1, 1];
  const unit = hasPixelSpacing ? 'mm' : 'px';

  switch (type) {
    case types.POLYLINE: {
      const { length } = measurement;
      const roundedLength = _round(length, 2);

      return [
        `${roundedLength} ${unit} (S:${seriesNumber}, I:${instanceNumber})`,
      ];
    }
    case types.BIDIRECTIONAL: {
      const { shortestDiameter, longestDiameter } = measurement;
      const roundedShortestDiameter = _round(shortestDiameter, 1);
      const roundedLongestDiameter = _round(longestDiameter, 1);

      return [
        `L: ${roundedLongestDiameter} ${unit} (S:${seriesNumber}, I:${instanceNumber})`,
        `W: ${roundedShortestDiameter} ${unit}`,
      ];
    }
    case types.ELLIPSE: {
      const { area } = measurement;
      const roundedArea = _round(area, 2);

      return [
        `${roundedArea} ${unit}<sup>2</sup> (S:${seriesNumber}, I:${instanceNumber})`,
      ];
    }
    case types.POINT: {
      const { text } = measurement; // Will display in "short description"
      return [`(S:${seriesNumber}, I:${instanceNumber})`];
    }
    case types.COBBANGLE: {
      const { rAngle } = measurement;
      return [`${_round(rAngle, 2)}\xB0 (S:${seriesNumber}, I:${instanceNumber})`]
    }
    default: {
      console.warn('Unknown type name mapping', type)
    }
  }
}

function _round(value, decimals) {
  return parseFloat(value).toFixed(decimals);
}
