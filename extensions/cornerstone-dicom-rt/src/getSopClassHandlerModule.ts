import { utils, Types as OhifTypes } from '@ohif/core';
import i18n from '@ohif/i18n';
import { segmentation as cstSegmentation } from '@cornerstonejs/tools';

import { SOPClassHandlerId } from './id';
import loadRTStruct from './loadRTStruct';

const { sopClassDictionary } = utils;

const sopClassUids = [sopClassDictionary.RTStructureSetStorage];

const loadPromises = {};

/**
 * Adds the RTSTRUCT fields to `displaySet`, for the newest of its instances,
 * and finds the referenced display set. Shared by the legacy builder and the
 * split-rule path (the `rtStructureSet` handler).
 *
 * @returns false when the RTSTRUCT has no ReferencedSeriesSequence.
 */
function _extendDisplaySet(
  displaySet,
  {
    servicesManager,
    extensionManager,
  }: { servicesManager: AppTypes.ServicesManager; extensionManager }
): boolean {
  const { instances } = displaySet;
  utils.sortStudyInstances(instances);
  // Choose the LAST instance in the list as the most recently created one.
  const instance = instances[instances.length - 1];

  const {
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    SeriesDescription = '',
    SeriesNumber,
    SOPClassUID,
    wadoRoot,
    wadoUri,
    wadoUriRoot,
    imageId: predecessorImageId,
  } = instance;

  /**
   * The "SeriesDate" for a display set is really the display set date, which
   * should be the date of the instance being used - for a structure set that is
   * usually the structure set date/time, and for one saved into an existing
   * series only the instance level date/time reflects the save.
   */
  const { SeriesDate, SeriesTime } = utils.getLatestInstanceDateTime(instance);

  Object.assign(displaySet, {
    Modality: 'RTSTRUCT',
    loading: false,
    isReconstructable: false,
    SeriesDescription,
    SeriesNumber,
    SeriesDate,
    SeriesTime,
    SOPInstanceUID,
    SeriesInstanceUID,
    StudyInstanceUID,
    SOPClassHandlerId,
    SOPClassUID,
    FrameOfReferenceUID: null,
    referencedImages: null,
    referencedSeriesInstanceUID: null,
    referencedDisplaySetInstanceUID: null,
    isDerivedDisplaySet: true,
    isLoaded: false,
    isHydrated: false,
    structureSet: null,
    sopClassUids,
    instance,
    predecessorImageId,
    wadoRoot,
    wadoUriRoot,
    wadoUri,
    isOverlayDisplaySet: true,
    label: SeriesDescription || `${i18n.t('Series')} ${SeriesNumber} - ${i18n.t('RTSTRUCT')}`,
  });

  let referencedSeriesSequence = instance.ReferencedSeriesSequence;
  if (
    instance.ReferencedFrameOfReferenceSequence?.RTReferencedStudySequence &&
    !instance.ReferencedSeriesSequence
  ) {
    instance.ReferencedSeriesSequence = _deriveReferencedSeriesSequenceFromFrameOfReferenceSequence(
      instance.ReferencedFrameOfReferenceSequence
    );
    referencedSeriesSequence = instance.ReferencedSeriesSequence;
  }

  if (!referencedSeriesSequence) {
    console.error('ReferencedSeriesSequence is missing for the RTSTRUCT');
    return false;
  }

  const referencedSeries = referencedSeriesSequence[0];

  displaySet.referencedImages = instance.ReferencedSeriesSequence.ReferencedInstanceSequence;
  displaySet.referencedSeriesInstanceUID = referencedSeries.SeriesInstanceUID;

  displaySet.FrameOfReferenceUID =
    instance.ReferencedFrameOfReferenceSequence?.[0]?.FrameOfReferenceUID;

  const { displaySetService } = servicesManager.services;
  const referencedDisplaySets =
    displaySetService.getDisplaySetsForReferences(referencedSeriesSequence);
  if (referencedDisplaySets?.length > 1) {
    console.warn(
      'Reference applies to more than 1 display set for Contours, applying only to first display set'
    );
  }

  if (!referencedDisplaySets || referencedDisplaySets.length === 0) {
    // Instead of throwing error, subscribe to display sets added
    const { unsubscribe } = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_ADDED,
      ({ displaySetsAdded }) => {
        const addedDisplaySet = displaySetsAdded[0];
        if (addedDisplaySet.SeriesInstanceUID === displaySet.referencedSeriesInstanceUID) {
          displaySet.referencedDisplaySetInstanceUID = addedDisplaySet.displaySetInstanceUID;
          displaySet.isReconstructable = addedDisplaySet.isReconstructable;
          displaySet.FrameOfReferenceUID = addedDisplaySet.FrameOfReferenceUID;
          unsubscribe();
        }
      }
    );
  } else {
    const [referencedDisplaySet] = referencedDisplaySets;
    displaySet.referencedDisplaySetInstanceUID = referencedDisplaySet.displaySetInstanceUID;
    displaySet.isReconstructable = referencedDisplaySet.isReconstructable;
    displaySet.FrameOfReferenceUID = referencedDisplaySet.FrameOfReferenceUID;
  }

  displaySet.load = ({ headers, createSegmentation = true }) =>
    _load(displaySet, servicesManager, extensionManager, headers, createSegmentation);

  return true;
}

function _getDisplaySetsFromSeries(
  instances,
  servicesManager: AppTypes.ServicesManager,
  extensionManager
) {
  const displaySet = { displaySetInstanceUID: utils.guid(), instances };
  if (!_extendDisplaySet(displaySet, { servicesManager, extensionManager })) {
    return;
  }
  return [displaySet];
}

function _load(
  rtDisplaySet,
  servicesManager: AppTypes.ServicesManager,
  extensionManager,
  headers,
  createSegmentation = true
) {
  const { SOPInstanceUID } = rtDisplaySet;
  const { segmentationService } = servicesManager.services;

  if (
    (rtDisplaySet.loading || rtDisplaySet.isLoaded) &&
    loadPromises[SOPInstanceUID] &&
    _segmentationExists(rtDisplaySet)
  ) {
    return loadPromises[SOPInstanceUID];
  }

  rtDisplaySet.loading = true;

  // We don't want to fire multiple loads, so we'll wait for the first to finish
  // and also return the same promise to any other callers.
  loadPromises[SOPInstanceUID] = new Promise<void>(async (resolve, reject) => {
    try {
      if (!rtDisplaySet.structureSet) {
        const structureSet = await loadRTStruct(extensionManager, rtDisplaySet, headers);
        rtDisplaySet.structureSet = structureSet;
      }

      if (createSegmentation) {
        await segmentationService.createSegmentationForRTDisplaySet(rtDisplaySet);
      }

      resolve();
    } catch (error) {
      reject(error);
    } finally {
      rtDisplaySet.loading = false;
    }
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

function _segmentationExists(segDisplaySet) {
  return !!cstSegmentation.state.getSegmentation(segDisplaySet.displaySetInstanceUID);
}

function getSopClassHandlerModule(params: OhifTypes.Extensions.ExtensionParams) {
  const { servicesManager, extensionManager } = params;

  return [
    {
      name: 'dicom-rt',
      sopClassUids,
      getDisplaySetsFromSeries: instances => {
        return _getDisplaySetsFromSeries(instances, servicesManager, extensionManager);
      },
      handlerNames: ['rtStructureSet'],
      extendDisplaySet: (displaySet, options) => {
        _extendDisplaySet(displaySet, options);
      },
    },
  ];
}

export default getSopClassHandlerModule;
