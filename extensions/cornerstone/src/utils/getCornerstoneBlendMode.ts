import { Enums } from '@cornerstonejs/core';

const MIP = 'mip';
const MINIP = 'minip';
const AVG = 'avg';

export default function getCornerstoneBlendMode(blendMode: string): Enums.BlendModes {
  if (!blendMode) {
    return Enums.BlendModes.COMPOSITE;
  }

  if (blendMode.toLowerCase() === MIP) {
    return Enums.BlendModes.MAXIMUM_INTENSITY_BLEND;
  }

  if (blendMode.toLowerCase() === MINIP) {
    return Enums.BlendModes.MINIMUM_INTENSITY_BLEND;
  }

  if (blendMode.toLowerCase() === AVG) {
    return Enums.BlendModes.AVERAGE_INTENSITY_BLEND;
  }

  throw new Error(`Unsupported blend mode: ${blendMode}`);
}
