import * as csStreamingImageVolumeLoader from '@cornerstonejs/streaming-image-volume-loader';

const { helpers: volumeLoaderHelpers } = csStreamingImageVolumeLoader;
const { getDynamicVolumeInfo } = volumeLoaderHelpers ?? {};

let is4DEnabled = false;

const volumeLoaderUtil = {
  /**
   * Check if 4D mode is enabled
   */
  is4DModeEnabled: (): boolean => is4DEnabled,
  /**
   * Enable 4D mode to allow splitting series into timepoints
   */
  enable4DMode: (): void => {
    is4DEnabled = true;
  },
  /**
   * Disable 4D mode
   */
  disable4DMode: (): void => {
    is4DEnabled = false;
  },
  /**
   * Check if a list of imageIds can be split into timepoints in order to load
   * it as a 4D series. If it is not possible the a single timepoint is returned
   * flagged as non-4D series.
   */
  getDynamicVolumeInfo: imageIds => {
    return is4DEnabled
      ? getDynamicVolumeInfo.call(null, imageIds)
      : { isDynamicVolume: false, timePoints: imageIds, splittingTag: null };
  },
};

export default volumeLoaderUtil;
