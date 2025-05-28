import toNumber from '@ohif/core/src/utils/toNumber';

/**
 * Check if all voxels in series images has same number of components (samplesPerPixel)
 * @param {*} instances
 * @returns
 */
export default function areAllImageComponentsEqual(instances: Array<any>): boolean {
  if (!instances?.length) {
    return false;
  }
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
