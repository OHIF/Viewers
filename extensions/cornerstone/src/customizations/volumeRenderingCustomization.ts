import { CONSTANTS } from '@cornerstonejs/core';

const { VIEWPORT_PRESETS } = CONSTANTS;

export default {
  'cornerstone.3dVolumeRendering': {
    volumeRenderingPresets: VIEWPORT_PRESETS,
    volumeRenderingQualityRange: {
      min: 1,
      max: 4,
      step: 1,
    },
  },
};
