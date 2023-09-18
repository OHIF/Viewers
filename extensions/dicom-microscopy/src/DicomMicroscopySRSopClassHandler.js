import OHIF, { DicomMetadataStore } from '@ohif/core';
import loadSR from './utils/loadSR';
import toArray from './utils/toArray';
import DCM_CODE_VALUES from './utils/dcmCodeValues';
import getSourceDisplaySet from './utils/getSourceDisplaySet';

const { utils } = OHIF;

const SOP_CLASS_UIDS = {
  COMPREHENSIVE_3D_SR: '1.2.840.10008.5.1.4.1.1.88.34',
};

const SOPClassHandlerId =
  '@ohif/extension-dicom-microscopy.sopClassHandlerModule.DicomMicroscopySRSopClassHandler';

function _getReferencedFrameOfReferenceUID(naturalizedDataset) {
  const { ContentSequence } = naturalizedDataset;

  const imagingMeasurementsContentItem = ContentSequence.find(
    ci => ci.ConceptNameCodeSequence.CodeValue === DCM_CODE_VALUES.IMAGING_MEASUREMENTS
  );

  const firstMeasurementGroupContentItem = toArray(
    imagingMeasurementsContentItem.ContentSequence
  ).find(ci => ci.ConceptNameCodeSequence.CodeValue === DCM_CODE_VALUES.MEASUREMENT_GROUP);

  const imageRegionContentItem = toArray(firstMeasurementGroupContentItem.ContentSequence).find(
    ci => ci.ConceptNameCodeSequence.CodeValue === DCM_CODE_VALUES.IMAGE_REGION
  );

  return imageRegionContentItem.ReferencedFrameOfReferenceUID;
}

function _getDisplaySetsFromSeries(instances, servicesManager, extensionManager) {
  // If the series has no instances, stop here
  if (!instances || !instances.length) {
    throw new Error('No instances were provided');
  }

  const { displaySetService, microscopyService } = servicesManager.services;

  const instance = instances[0];

  // TODO ! Consumption of DICOMMicroscopySRSOPClassHandler to a derived dataset or normal dataset?
  // TODO -> Easy to swap this to a "non-derived" displaySet, but unfortunately need to put it in a different extension.
  const naturalizedDataset = DicomMetadataStore.getSeries(
    instance.StudyInstanceUID,
    instance.SeriesInstanceUID
  ).instances[0];
  const ReferencedFrameOfReferenceUID = _getReferencedFrameOfReferenceUID(naturalizedDataset);

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

  const displaySet = {
    plugin: 'microscopy',
    Modality: 'SR',
    altImageText: 'Microscopy SR',
    displaySetInstanceUID: utils.guid(),
    SOPInstanceUID,
    SeriesInstanceUID,
    StudyInstanceUID,
    ReferencedFrameOfReferenceUID,
    SOPClassHandlerId,
    SOPClassUID,
    SeriesDescription,
    // Map the content date/time to the series date/time, these are only used for filtering.
    SeriesDate: ContentDate,
    SeriesTime: ContentTime,
    SeriesNumber,
    instance,
    metadata: naturalizedDataset,
    isDerived: true,
    isLoading: false,
    isLoaded: false,
    loadError: false,
  };

  displaySet.load = function (referencedDisplaySet) {
    return loadSR(microscopyService, displaySet, referencedDisplaySet).catch(error => {
      displaySet.isLoaded = false;
      displaySet.loadError = true;
      throw new Error(error);
    });
  };

  displaySet.getSourceDisplaySet = function () {
    let allDisplaySets = [];
    const studyMetadata = DicomMetadataStore.getStudy(StudyInstanceUID);
    studyMetadata.series.forEach(series => {
      const displaySets = displaySetService.getDisplaySetsForSeries(series.SeriesInstanceUID);
      allDisplaySets = allDisplaySets.concat(displaySets);
    });
    return getSourceDisplaySet(allDisplaySets, displaySet);
  };

  return [displaySet];
}

export default function getDicomMicroscopySRSopClassHandler({ servicesManager, extensionManager }) {
  const getDisplaySetsFromSeries = instances => {
    return _getDisplaySetsFromSeries(instances, servicesManager, extensionManager);
  };

  return {
    name: 'DicomMicroscopySRSopClassHandler',
    sopClassUids: [SOP_CLASS_UIDS.COMPREHENSIVE_3D_SR],
    getDisplaySetsFromSeries,
  };
}
