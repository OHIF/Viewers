import OHIF from '@ohif/core';
import i18n from '@ohif/i18n';
import { utilities as csUtils, Enums as csEnums } from '@cornerstonejs/core';
import dcmjs from 'dcmjs';
import { dicomWebUtils } from '@ohif/extension-default';

const { MetadataModules } = csEnums;
const { utils } = OHIF;
const { denaturalizeDataset } = dcmjs.data.DicomMetaDictionary;
const { transferDenaturalizedDataset, fixMultiValueKeys } = dicomWebUtils;

const SOP_CLASS_UIDS = {
  VL_WHOLE_SLIDE_MICROSCOPY_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.77.1.6',
};

const SOPClassHandlerId =
  '@ohif/extension-cornerstone.sopClassHandlerModule.DicomMicroscopySopClassHandler';

function _getDisplaySetsFromSeries(instances, servicesManager, extensionManager) {
  const dataSource = extensionManager.getActiveDataSource()[0];
  // If the series has no instances, stop here
  if (!instances || !instances.length) {
    throw new Error('No instances were provided');
  }

  const instance = instances[0];

  let singleFrameInstance = instance;
  let currentFrames = +singleFrameInstance.NumberOfFrames || 1;
  for (const instanceI of instances) {
    const framesI = +instanceI.NumberOfFrames || 1;
    if (framesI < currentFrames) {
      singleFrameInstance = instanceI;
      currentFrames = framesI;
    }
  }

  const {
    FrameOfReferenceUID,
    SeriesDescription,
    ContentDate,
    ContentTime,
    SeriesNumber,
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    SOPClassUID,
  } = instance;

  instances = instances.map(inst => {
    // NOTE: According to DICOM standard a series should have a FrameOfReferenceUID
    // When the Microscopy file was built by certain tool from multiple image files,
    // each instance's FrameOfReferenceUID is sometimes different.
    // Even though this means the file was not well formatted DICOM VL Whole Slide Microscopy Image,
    // the case is so often, so let's override this value manually here.
    //
    // https://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.7.4.html#sect_C.7.4.1.1.1

    inst.FrameOfReferenceUID = instance.FrameOfReferenceUID;

    return inst;
  });

  const othersFrameOfReferenceUID = instances
    .filter(v => v)
    .map(inst => inst.FrameOfReferenceUID)
    .filter((value, index, array) => array.indexOf(value) === index);
  if (othersFrameOfReferenceUID.length > 1) {
    console.warn(
      'Expected FrameOfReferenceUID of difference instances within a series to be the same, found multiple different values',
      othersFrameOfReferenceUID
    );
  }

  const displaySet = {
    plugin: 'microscopy',
    Modality: 'SM',
    viewportType: csEnums.ViewportType.WHOLE_SLIDE,
    altImageText: 'Microscopy',
    displaySetInstanceUID: utils.guid(),
    SOPInstanceUID,
    SeriesInstanceUID,
    StudyInstanceUID,
    FrameOfReferenceUID,
    SOPClassHandlerId,
    SOPClassUID,
    SeriesDescription: SeriesDescription || 'Microscopy Data',
    // Map ContentDate/Time to SeriesTime for series list sorting.
    SeriesDate: ContentDate,
    SeriesTime: ContentTime,
    SeriesNumber,
    firstInstance: singleFrameInstance, // top level instance in the image Pyramid
    instance,
    numImageFrames: 0,
    numInstances: 1,
    others: instances, // all other level instances in the image Pyramid
    instances,
    othersFrameOfReferenceUID,
    imageIds: instances.map(instance => instance.imageId),
    getThumbnailSrc: dataSource.retrieve.getGetThumbnailSrc?.(
      singleFrameInstance,
      singleFrameInstance.imageId
    ),
    label: SeriesDescription || `${i18n.t('Series')} ${SeriesNumber} - ${i18n.t('SM')}`,
  };
  // The microscopy viewer directly accesses the metadata already loaded, and
  // uses the DICOMweb client library directly for loading, so it has to be
  // provided here.
  const dicomWebClient = dataSource.retrieve.getWadoDicomWebClient?.();
  const instanceMap = new Map();
  instances.forEach(instance => instanceMap.set(instance.imageId, instance));
  if (dicomWebClient) {
    const webClient = Object.create(dicomWebClient);
    // This replaces just the dicom web metadata call with one which retrieves
    // internally.
    webClient.getDICOMwebMetadata = getDICOMwebMetadata.bind(webClient, instanceMap);

    csUtils.genericMetadataProvider.addRaw(displaySet.imageIds[0], {
      type: MetadataModules.WADO_WEB_CLIENT,
      metadata: webClient,
    });
  } else {
    // Might have some other way of getting the data in the future or internally?
    // throw new Error('Unable to provide a DICOMWeb client library, microscopy will fail to view');
  }

  return [displaySet];
}

/**
 * This method provides access to the internal DICOMweb metadata, used to avoid
 * refetching the DICOMweb data.  It gets assigned as a member function to the
 * dicom web client.
 */
function getDICOMwebMetadata(instanceMap, imageId) {
  const instance = instanceMap.get(imageId);
  if (!instance) {
    console.warn('Metadata not already found for', imageId, 'in', instanceMap);
    return this.super.getDICOMwebMetadata(imageId);
  }
  return transferDenaturalizedDataset(
    denaturalizeDataset(fixMultiValueKeys(instanceMap.get(imageId)))
  );
}

export function getDicomMicroscopySopClassHandler({ servicesManager, extensionManager }) {
  const getDisplaySetsFromSeries = instances => {
    return _getDisplaySetsFromSeries(instances, servicesManager, extensionManager);
  };

  return {
    name: 'DicomMicroscopySopClassHandler',
    sopClassUids: [SOP_CLASS_UIDS.VL_WHOLE_SLIDE_MICROSCOPY_IMAGE_STORAGE],
    getDisplaySetsFromSeries,
  };
}

export function getSopClassHandlerModule(params) {
  return [getDicomMicroscopySopClassHandler(params)];
}
