import { Enums } from '@cornerstonejs/core';

const MIP = 'mip';

export default function getCornerstoneBlendMode(blendMode: string): Enums.BlendModes {
  if (!blendMode) {
    return Enums.BlendModes.COMPOSITE;
  }

  if (blendMode.toLowerCase() === MIP) {
    return Enums.BlendModes.MAXIMUM_INTENSITY_BLEND;
  }

  throw new Error();
}
