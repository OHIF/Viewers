import * as cornerstoneNIFTIImageLoader from '@cornerstonejs/nifti-image-loader';
import cornerstone from 'cornerstone-core';

export default function() {
  // window.cornerstoneNIFTIImageLoader = cornerstoneNIFTIImageLoader;
  cornerstoneNIFTIImageLoader.nifti.streamingMode = true;
  cornerstoneNIFTIImageLoader.external.cornerstone = cornerstone;
}
