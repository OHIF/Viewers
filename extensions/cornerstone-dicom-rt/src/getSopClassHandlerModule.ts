import { utils } from '@ohif/core';

import { SOPClassHandlerId } from './id';
import loadRTStruct from './loadRTStruct';

const sopClassUids = ['1.2.840.10008.5.1.4.1.1.481.3'];

const loadPromises = {};

function _getDisplaySetsFromSeries(
  instances,
  servicesManager: AppTypes.ServicesManager,
  extensionManager
) {
  const instance = instances[0];

  const {
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    SeriesDescription,
    SeriesNumber,
    SeriesDate,
    SOPClassUID,
    wadoRoot,
    wadoUri,
    wadoUriRoot,
  } = instance;

  const displaySet = {
    Modality: 'RTSTRUCT',
    loading: false,
    isReconstructable: false, // by default for now since it is a volumetric SEG currently
    displaySetInstanceUID: utils.guid(),
    SeriesDescription,
    SeriesNumber,
    SeriesDate,
    SOPInstanceUID,
    SeriesInstanceUID,
    StudyInstanceUID,
    SOPClassHandlerId,
    SOPClassUID,
    referencedImages: null,
    referencedSeriesInstanceUID: null,
    referencedDisplaySetInstanceUID: null,
    isDerivedDisplaySet: true,
    isLoaded: false,
    isHydrated: false,
    structureSet: null,
    sopClassUids,
    instance,
    wadoRoot,
    wadoUriRoot,
    wadoUri,
    isOverlayDisplaySet: true,
  };

  let referencedSeriesSequence = instance.ReferencedSeriesSequence;
  if (instance.ReferencedFrameOfReferenceSequence && !instance.ReferencedSeriesSequence) {
    instance.ReferencedSeriesSequence = _deriveReferencedSeriesSequenceFromFrameOfReferenceSequence(
      instance.ReferencedFrameOfReferenceSequence
    );
    referencedSeriesSequence = instance.ReferencedSeriesSequence;
  }

  if (!referencedSeriesSequence) {
    throw new Error('ReferencedSeriesSequence is missing for the RTSTRUCT');
  }

  const referencedSeries = referencedSeriesSequence[0];

  displaySet.referencedImages = instance.ReferencedSeriesSequence.ReferencedInstanceSequence;
  displaySet.referencedSeriesInstanceUID = referencedSeries.SeriesInstanceUID;

  displaySet.getReferenceDisplaySet = () => {
    const { displaySetService } = servicesManager.services;
    const referencedDisplaySets = displaySetService.getDisplaySetsForSeries(
      displaySet.referencedSeriesInstanceUID
    );

    if (!referencedDisplaySets || referencedDisplaySets.length === 0) {
      throw new Error('Referenced DisplaySet is missing for the RT');
    }

    const referencedDisplaySet = referencedDisplaySets[0];

    displaySet.referencedDisplaySetInstanceUID = referencedDisplaySet.displaySetInstanceUID;

    return referencedDisplaySet;
  };

  displaySet.load = ({ headers }) => _load(displaySet, servicesManager, extensionManager, headers);

  return [displaySet];
}

function _load(rtDisplaySet, servicesManager: AppTypes.ServicesManager, extensionManager, headers) {
  const { SOPInstanceUID } = rtDisplaySet;
  const { segmentationService } = servicesManager.services;
  if (
    (rtDisplaySet.loading || rtDisplaySet.isLoaded) &&
    loadPromises[SOPInstanceUID] &&
    _segmentationExistsInCache(rtDisplaySet, segmentationService)
  ) {
    return loadPromises[SOPInstanceUID];
  }

  rtDisplaySet.loading = true;

  // We don't want to fire multiple loads, so we'll wait for the first to finish
  // and also return the same promise to any other callers.
  loadPromises[SOPInstanceUID] = new Promise(async (resolve, reject) => {
    if (!rtDisplaySet.structureSet) {
      const structureSet = await loadRTStruct(
        extensionManager,
        rtDisplaySet,
        rtDisplaySet.getReferenceDisplaySet(),
        headers
      );

      rtDisplaySet.structureSet = structureSet;
    }

    const suppressEvents = true;
    segmentationService
      .createSegmentationForRTDisplaySet(rtDisplaySet, null, suppressEvents)
      .then(() => {
        rtDisplaySet.loading = false;
        resolve();
      })
      .catch(error => {
        rtDisplaySet.loading = false;
        reject(error);
      });
  });

  return loadPromises[SOPInstanceUID];
}

function _deriveReferencedSeriesSequenceFromFrameOfReferenceSequence(
  ReferencedFrameOfReferenceSequence
) {
  const ReferencedSeriesSequence = [];

  ReferencedFrameOfReferenceSequence.forEach(referencedFrameOfReference => {
    const { RTReferencedStudySequence } = referencedFrameOfReference;

    RTReferencedStudySequence.forEach(rtReferencedStudy => {
      const { RTReferencedSeriesSequence } = rtReferencedStudy;

      RTReferencedSeriesSequence.forEach(rtReferencedSeries => {
        const ReferencedInstanceSequence = [];
        const { ContourImageSequence, SeriesInstanceUID } = rtReferencedSeries;

        ContourImageSequence.forEach(contourImage => {
          ReferencedInstanceSequence.push({
            ReferencedSOPInstanceUID: contourImage.ReferencedSOPInstanceUID,
            ReferencedSOPClassUID: contourImage.ReferencedSOPClassUID,
          });
        });

        const referencedSeries = {
          SeriesInstanceUID,
          ReferencedInstanceSequence,
        };

        ReferencedSeriesSequence.push(referencedSeries);
      });
    });
  });

  return ReferencedSeriesSequence;
}

function _segmentationExistsInCache(
  rtDisplaySet,
  segmentationService: AppTypes.SegmentationService
) {
  // Todo: fix this
  return false;
  // This should be abstracted with the CornerstoneCacheService
  const rtContourId = rtDisplaySet.displaySetInstanceUID;
  const contour = segmentationService.getContour(rtContourId);

  return contour !== undefined;
}

function getSopClassHandlerModule({ servicesManager, extensionManager }) {
  return [
    {
      name: 'dicom-rt',
      sopClassUids,
      getDisplaySetsFromSeries: instances => {
        return _getDisplaySetsFromSeries(instances, servicesManager, extensionManager);
      },
    },
  ];
}

export default getSopClassHandlerModule;
