import toNumber from '@ohif/core/src/utils/toNumber';

/**
 * Check if the series has frames with different samplesPerPixel
 * @param {*} instances
 * @returns
 */
export default function checkSeriesComponents(instances) {
  const firstImage = instances[0];
  const firstImageSamplesPerPixel = toNumber(firstImage.SamplesPerPixel);

  for (let i = 1; i < instances.length; i++) {
    const instance = instances[i];
    const { SamplesPerPixel } = instance;

    if (SamplesPerPixel !== firstImageSamplesPerPixel) {
      return false;
    }
  }
  return true;
}
