import { utils } from '@ohif/core';
import getDisplaySetsFromUnsupportedSeries, {
  extendUnsupportedDisplaySet,
} from './getDisplaySetsFromUnsupportedSeries';
import { chartHandler } from './SOPClassHandlers/chartSOPClassHandler';
import {
  makeImageSetDisplaySet,
  STACK_SOP_CLASS_HANDLER_NAME,
} from './displaySetSplitting/makeImageSetDisplaySet';
import { STACK_SOP_CLASS_UIDS } from './displaySetSplitting/stackSopClassUids';

const { isImage } = utils;

// Shared with the STACK_SOP_CLASS_HANDLER_ID the display set factory stamps
// onto every display set it builds, so the two cannot drift.
const sopClassHandlerName = STACK_SOP_CLASS_HANDLER_NAME;
let appContext = {};

const isMultiFrame = instance => {
  return instance.NumberOfFrames > 1;
};

const makeDisplaySet = instances => makeImageSetDisplaySet(instances, appContext);

const isSingleImageModality = modality => {
  return modality === 'CR' || modality === 'MG' || modality === 'DX';
};

/**
 * The stack fields of a display set: the instance number and acquisition time
 * of a display set of one multi-frame or single-image instance, else the study.
 * Shared by the legacy builder and the split-rule path.
 */
function extendStackDisplaySet(displaySet) {
  const { images } = displaySet;
  const [instance] = images;
  if (images.length === 1 && (isMultiFrame(instance) || isSingleImageModality(instance.Modality))) {
    displaySet.setAttributes({
      instanceNumber: instance.InstanceNumber,
      acquisitionDatetime: instance.AcquisitionDateTime,
    });
  } else {
    displaySet.setAttribute('studyInstanceUid', instance.StudyInstanceUID);
  }
}

function getSopClassUids(instances) {
  const uniqueSopClassUidsInSeries = new Set();
  instances.forEach(instance => {
    uniqueSopClassUidsInSeries.add(instance.SOPClassUID);
  });
  const sopClassUids = Array.from(uniqueSopClassUidsInSeries);

  return sopClassUids;
}

/**
 * Basic SOPClassHandler:
 * - For all Image types that are stackable, create
 *   a displaySet with a stack of images
 *
 * @param {SeriesMetadata} series The series metadata object from which the display sets will be created
 * @returns {Array} The list of display sets created for the given series object
 */
function getDisplaySetsFromSeries(instances) {
  // If the series has no instances, stop here
  if (!instances || !instances.length) {
    throw new Error('No instances were provided');
  }

  const displaySets = [];
  const sopClassUids = getSopClassUids(instances);

  // Search through the instances (InstanceMetadata object) of this series
  // Split Multi-frame instances and Single-image modalities
  // into their own specific display sets. Place the rest of each
  // series into another display set.
  const stackableInstances = [];
  instances.forEach((instance, instanceIndex) => {
    // All imaging modalities must have a valid value for sopClassUid (x00080016) or rows (x00280010)
    if (!isImage(instance.SOPClassUID) && !instance.Rows) {
      return;
    }

    let displaySet;
    if (isMultiFrame(instance)) {
      displaySet = makeDisplaySet([instance]);
      displaySet.setAttributes({
        sopClassUids,
        numImageFrames: instance.NumberOfFrames,
      });
      extendStackDisplaySet(displaySet);
      displaySets.push(displaySet);
    } else if (isSingleImageModality(instance.Modality)) {
      displaySet = makeDisplaySet([instance]);
      displaySet.setAttributes({ sopClassUids });
      extendStackDisplaySet(displaySet);
      displaySets.push(displaySet);
    } else {
      stackableInstances.push(instance);
    }
  });

  if (stackableInstances.length) {
    const displaySet = makeDisplaySet(stackableInstances);
    // A single stackable instance is neither multi-frame nor single-image, so
    // this sets `studyInstanceUid`.
    extendStackDisplaySet(displaySet);
    displaySet.setAttributes({
      sopClassUids,
    });
    displaySets.push(displaySet);
  }

  return displaySets;
}

const sopClassUids = STACK_SOP_CLASS_UIDS;

function getSopClassHandlerModule(appContextParam) {
  appContext = appContextParam;

  return [
    {
      name: sopClassHandlerName,
      sopClassUids,
      getDisplaySetsFromSeries,
      // The image part of the split-rule display set is the generic step of
      // `makeDisplaySetFromInstanceGroup`; this adds the stack fields only.
      handlerNames: ['image'],
      extendDisplaySet: extendStackDisplaySet,
    },
    {
      name: 'not-supported-display-sets-handler',
      sopClassUids: [],
      getDisplaySetsFromSeries: getDisplaySetsFromUnsupportedSeries,
      handlerNames: ['unsupported'],
      extendDisplaySet: extendUnsupportedDisplaySet,
    },
    {
      name: chartHandler.name,
      sopClassUids: chartHandler.sopClassUids,
      getDisplaySetsFromSeries: chartHandler.getDisplaySetsFromSeries,
      handlerNames: chartHandler.handlerNames,
      extendDisplaySet: chartHandler.extendDisplaySet,
    },
  ];
}

export default getSopClassHandlerModule;
