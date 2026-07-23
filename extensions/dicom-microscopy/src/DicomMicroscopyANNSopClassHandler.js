import OHIF, { DicomMetadataStore } from '@ohif/core';
import loadAnnotation from './utils/loadAnnotation';
import getSourceDisplaySet from './utils/getSourceDisplaySet';

const { utils } = OHIF;

const SOP_CLASS_UIDS = {
  MICROSCOPY_BULK_SIMPLE_ANNOTATION: '1.2.840.10008.5.1.4.1.1.91.1',
};

const SOPClassHandlerId =
  '@ohif/extension-dicom-microscopy.sopClassHandlerModule.DicomMicroscopyANNSopClassHandler';

function _getDisplaySetsFromSeries(instances, servicesManager, extensionManager) {
  // If the series has no instances, stop here
  if (!instances || !instances.length) {
    throw new Error('No instances were provided');
  }

  const { displaySetService, microscopyService } = servicesManager.services;

  // Sort instances by date/time in ascending order (oldest first)
  const sortedInstances = [...instances].sort((a, b) => {
    const dateA = `${a.ContentDate}${a.ContentTime}`;
    const dateB = `${b.ContentDate}${b.ContentTime}`;
    return dateA.localeCompare(dateB);
  });

  // Get the most recent instance (last in the sorted array)
  const instance = sortedInstances[sortedInstances.length - 1];

  const naturalizedDataset = DicomMetadataStore.getSeries(
    instance.StudyInstanceUID,
    instance.SeriesInstanceUID
  ).instances[0];

  const {
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
    isOverlayDisplaySet: true,
    plugin: 'microscopy',
    Modality: 'ANN',
    thumbnailSrc: null,
    altImageText: 'Microscopy Annotation',
    displaySetInstanceUID: utils.uuidv4(),
    SOPInstanceUID,
    SeriesInstanceUID,
    StudyInstanceUID,
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

  displaySet.load = function () {
    return loadAnnotation({
      microscopyService,
      displaySet,
      extensionManager,
      servicesManager,
    }).catch(error => {
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
    const ds = getSourceDisplaySet(allDisplaySets, displaySet);
    return ds;
  };

  return [displaySet];
}

export default function getDicomMicroscopyANNSopClassHandler({
  servicesManager,
  extensionManager,
}) {
  const getDisplaySetsFromSeries = instances => {
    return _getDisplaySetsFromSeries(instances, servicesManager, extensionManager);
  };

  return {
    name: 'DicomMicroscopyANNSopClassHandler',
    sopClassUids: [SOP_CLASS_UIDS.MICROSCOPY_BULK_SIMPLE_ANNOTATION],
    getDisplaySetsFromSeries,
  };
}
