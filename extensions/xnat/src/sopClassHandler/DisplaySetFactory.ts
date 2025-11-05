/**
 * Display set creation and factory functions
 * Extracted from getSopClassHandlerModule.tsx
 */

import { utils, classes } from '@ohif/core';
import i18n from '@ohif/i18n';
import { id } from '../id';
import getDisplaySetMessages from '../getDisplaySetMessages';

import type { AppContextType, XNATSeriesMetadata, DisplaySetAttributes } from './Types';
import { sopClassHandlerName } from './Constants';
import { getDisplaySetInfo, getVolumeLoaderScheme, isMultiFrame } from './VolumeUtils';

const { sortStudyInstances, instancesSortCriteria } = utils;
const { ImageSet } = classes;

/**
 * Create a display set from instances
 * @param instances - Array of DICOM instances
 * @param appContext - Application context
 * @returns Created ImageSet
 */
export function makeDisplaySet(instances: any[], appContext: AppContextType) {
  // Sort instances by InstanceNumber or AcquisitionNumber
  if (instances && instances.length > 0 && instances[0] && instances[0].InstanceNumber !== undefined) {
    sortStudyInstances(instances);
  } else if (instances && instances.length > 0 && instances[0] && instances[0].AcquisitionNumber !== undefined) {
    instances.sort((a, b) => (parseInt(a.AcquisitionNumber) || 0) - (parseInt(b.AcquisitionNumber) || 0) || (parseInt(a.InstanceNumber) || 0) - (parseInt(b.InstanceNumber) || 0));
  }

  const instance = instances[0];
  const imageSet = new ImageSet(instances);

  const { extensionManager } = appContext;
  let dataSource;
  if (extensionManager && typeof extensionManager.getActiveDataSource === 'function') {
    const activeDataSources = extensionManager.getActiveDataSource();
    if (activeDataSources && activeDataSources.length > 0) {
      dataSource = activeDataSources[0];
    }
  }

  if (!dataSource) {
    console.warn('XNAT SOPClassHandler - makeDisplaySet: Unable to get active dataSource from extensionManager.');
  }

  const displaySetInfo = getDisplaySetInfo(instances, appContext);
  const {
    isDynamicVolume,
    value: isReconstructable,
    averageSpacingBetweenFrames,
    dynamicVolumeInfo,
  } = displaySetInfo;

  const volumeLoaderSchema = getVolumeLoaderScheme(isDynamicVolume);
  const messages = getDisplaySetMessages(instances, isReconstructable, isDynamicVolume);

  // Determine display set image ID and thumbnail instance
  let displaySetImageId;
  let thumbnailInstance = instances[Math.floor(instances.length / 2)];

  if (dataSource && typeof dataSource.getImageIdsForDisplaySet === 'function') {
    const allImageIdsInDisplaySet = dataSource.getImageIdsForDisplaySet(imageSet);
    displaySetImageId = allImageIdsInDisplaySet[Math.floor(allImageIdsInDisplaySet.length / 2)];

    if (isDynamicVolume && dynamicVolumeInfo.timePoints && dynamicVolumeInfo.timePoints.length > 0) {
      const timePoints = dynamicVolumeInfo.timePoints;
      const middleTimePointIndex = Math.floor(timePoints.length / 2);
      const middleTimePointImageIds = timePoints[middleTimePointIndex];
      if (middleTimePointImageIds && middleTimePointImageIds.length > 0) {
        displaySetImageId = middleTimePointImageIds[Math.floor(middleTimePointImageIds.length / 2)];
        thumbnailInstance = instances.find(inst => inst.imageId === displaySetImageId) || thumbnailInstance;
      }
    }
  } else {
    displaySetImageId = (thumbnailInstance && thumbnailInstance.imageId) || (instance && instance.imageId);
  }

  // Get metadata from XNAT series metadata if available
  const StudyInstanceUID = instance.StudyInstanceUID;
  const SeriesInstanceUID = instance.SeriesInstanceUID;
  let seriesMetadata = null;
  let studyMetadata = null;

  // Construct imageIds array
  const imageIds = instances.map(inst => inst.imageId).filter(id => id);

  if (appContext.servicesManager && appContext.servicesManager.services) {
    const AppContextService = appContext.servicesManager.services.AppContext;
    if (AppContextService && AppContextService.xnatSeriesMetadata) {
      const xnatSeriesMetadata = AppContextService.xnatSeriesMetadata as XNATSeriesMetadata;
      studyMetadata = xnatSeriesMetadata[StudyInstanceUID];
      if (studyMetadata && Array.isArray(studyMetadata.series)) {
        seriesMetadata = studyMetadata.series.find(
          s => s.SeriesInstanceUID === SeriesInstanceUID
        );
      }
    }
  }

  // Build initial attributes
  const initialAttributes: DisplaySetAttributes = {
    SeriesDate: (seriesMetadata?.SeriesDate) || instance?.SeriesDate,
    SeriesTime: (seriesMetadata?.SeriesTime) || instance?.SeriesTime,
    SeriesInstanceUID: instance?.SeriesInstanceUID,
    StudyInstanceUID: instance?.StudyInstanceUID,
    SeriesNumber: (seriesMetadata?.SeriesNumber) || instance?.SeriesNumber || 0,
    SeriesDescription: (seriesMetadata?.SeriesDescription) || instance?.SeriesDescription || '',
    Modality: (seriesMetadata?.Modality) || instance?.Modality,
    PatientID: (seriesMetadata?.PatientID) || (studyMetadata?.PatientID) || instance?.PatientID,
    PatientName: (seriesMetadata?.PatientName) || (studyMetadata?.PatientName) || instance?.PatientName,
    StudyDate: (seriesMetadata?.StudyDate) || (studyMetadata?.StudyDate) || instance?.StudyDate,
    StudyTime: (seriesMetadata?.StudyTime) || (studyMetadata?.StudyTime) || instance?.StudyTime,
    StudyDescription: (seriesMetadata?.StudyDescription) || (studyMetadata?.StudyDescription) || instance?.StudyDescription || 'No Description',
    volumeLoaderSchema,
    displaySetInstanceUID: imageSet.uid,
    FrameRate: instance?.FrameTime,
    SOPClassUID: instance?.SOPClassUID,
    isMultiFrame: isMultiFrame(instance),
    countIcon: isReconstructable ? 'icon-mpr' : undefined,
    numImageFrames: instances.length,
    SOPClassHandlerId: `${id}.sopClassHandlerModule.${sopClassHandlerName}`,
    isReconstructable,
    messages,
    averageSpacingBetweenFrames: averageSpacingBetweenFrames || null,
    isDynamicVolume,
    dynamicVolumeInfo,
    imageIds,
    getThumbnailSrc: dataSource && typeof dataSource.retrieve?.getGetThumbnailSrc === 'function'
      ? dataSource.retrieve.getGetThumbnailSrc(thumbnailInstance, displaySetImageId)
      : undefined,
    supportsWindowLevel: true,
    FrameOfReferenceUID: instance?.FrameOfReferenceUID,
    label: '',
  };

  // Create display label
  const labelSeriesDesc = initialAttributes.SeriesDescription;
  const labelSeriesNumber = initialAttributes.SeriesNumber;
  const labelModality = initialAttributes.Modality;
  initialAttributes.label = labelSeriesDesc || `${i18n.t('Series')} ${labelSeriesNumber} - ${labelModality ? i18n.t(labelModality) : ''}`;

  imageSet.setAttributes(initialAttributes);
  imageSet.sortBy(instancesSortCriteria.default);

  return imageSet;
}
