/**
 * Main display set processing logic
 * Extracted from getSopClassHandlerModule.tsx
 */

import { utils } from '@ohif/core';
import { makeDisplaySet } from './DisplaySetFactory';
import { getSopClassUids } from './SopClassUtils';
import { isMultiFrame, isSingleImageModality } from './VolumeUtils';
import type { AppContextType } from './Types';

const { isImage } = utils;

/**
 * Process instances from a series to create display sets
 * Basic SOPClassHandler:
 * - For all Image types that are stackable, create a displaySet with a stack of images
 *
 * @param instances - The list of instances for the series
 * @param appContext - Application context
 * @returns The list of display sets created for the given series object
 */
export function getDisplaySetsFromSeries(instances: any[], appContext: AppContextType) {
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
  instances.forEach(instance => {
    // All imaging modalities must have a valid value for sopClassUid (x00080016) or rows (x00280010)
    if (!isImage(instance.SOPClassUID) && !instance.Rows) {
      return;
    }

    let displaySet;
    if (isMultiFrame(instance)) {
      displaySet = makeDisplaySet([instance], appContext);
      displaySet.setAttributes({
        sopClassUids,
        numImageFrames: instance.NumberOfFrames,
        instanceNumber: instance.InstanceNumber,
        acquisitionDatetime: instance.AcquisitionDateTime,
      });
      displaySets.push(displaySet);
    } else if (isSingleImageModality(instance.Modality)) {
      displaySet = makeDisplaySet([instance], appContext);
      displaySet.setAttributes({
        sopClassUids,
        instanceNumber: instance.InstanceNumber,
        acquisitionDatetime: instance.AcquisitionDateTime,
      });
      displaySets.push(displaySet);
    } else {
      stackableInstances.push(instance);
    }
  });

  if (stackableInstances.length) {
    const displaySet = makeDisplaySet(stackableInstances, appContext);
    displaySet.setAttribute('studyInstanceUid', instances[0].StudyInstanceUID);
    displaySet.setAttributes({
      sopClassUids,
    });
    displaySets.push(displaySet);
  }

  return displaySets;
}
