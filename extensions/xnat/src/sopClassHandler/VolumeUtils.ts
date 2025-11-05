/**
 * Volume handling utilities
 * Extracted from getSopClassHandlerModule.tsx
 */

import type { AppContextType, DisplaySetInfo } from './Types';
import { DEFAULT_VOLUME_LOADER_SCHEME, DYNAMIC_VOLUME_LOADER_SCHEME } from './Constants';

/**
 * Get dynamic volume information for instances
 * @param instances - Array of DICOM instances
 * @param appContext - Application context
 * @returns Dynamic volume information
 */
export function getDynamicVolumeInfo(instances: any[], appContext: AppContextType) {
  const { extensionManager } = appContext;

  if (!extensionManager) {
    console.warn('getDynamicVolumeInfo: extensionManager is not available');
    return { isDynamicVolume: false, timePoints: [], getRegularTimePointData: () => [] };
  }

  const imageIds = instances.map(({ imageId }) => imageId);
  const volumeLoaderUtility = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.volumeLoader'
  );

  if (!volumeLoaderUtility || !volumeLoaderUtility.exports || !volumeLoaderUtility.exports.getDynamicVolumeInfo) {
    console.warn('getDynamicVolumeInfo: cornerstone.utilityModule.volumeLoader or its getDynamicVolumeInfo export is not available.');
    return { isDynamicVolume: false, timePoints: [], getRegularTimePointData: () => [] };
  }
  const { getDynamicVolumeInfo: csGetDynamicVolumeInfo } = volumeLoaderUtility.exports;
  return csGetDynamicVolumeInfo(imageIds);
}

/**
 * Check if an instance is multi-frame
 * @param instance - DICOM instance
 * @returns True if multi-frame
 */
export function isMultiFrame(instance: any): boolean {
  return instance.NumberOfFrames > 1;
}

/**
 * Check if a modality is single-image only
 * @param modality - DICOM modality
 * @returns True if single-image modality
 */
export function isSingleImageModality(modality: string): boolean {
  return modality === 'CR' || modality === 'MG' || modality === 'DX';
}

/**
 * Get display set information including volume and reconstructability info
 * @param instances - Array of DICOM instances
 * @param appContext - Application context
 * @returns Display set information
 */
export function getDisplaySetInfo(instances: any[], appContext: AppContextType): DisplaySetInfo {
  const dynamicVolumeInfo = getDynamicVolumeInfo(instances, appContext);
  const { appConfig } = appContext;

  if (dynamicVolumeInfo.isDynamicVolume) {
    return {
      isDynamicVolume: true,
      value: false,
      averageSpacingBetweenFrames: null,
      dynamicVolumeInfo,
    };
  }

  const { isDisplaySetReconstructable } = require('@ohif/core').utils;
  const reconstructableResult = isDisplaySetReconstructable(instances, appConfig);

  return {
    isDynamicVolume: false,
    value: reconstructableResult.value,
    averageSpacingBetweenFrames: reconstructableResult.averageSpacingBetweenFrames,
    dynamicVolumeInfo,
  };
}

/**
 * Get the appropriate volume loader scheme
 * @param isDynamicVolume - Whether this is a dynamic volume
 * @returns Volume loader scheme
 */
export function getVolumeLoaderScheme(isDynamicVolume: boolean): string {
  return isDynamicVolume ? DYNAMIC_VOLUME_LOADER_SCHEME : DEFAULT_VOLUME_LOADER_SCHEME;
}
