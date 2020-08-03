import React from 'react';
import { DICOMSR, DicomMetadataStore } from '@ohif/core';

/**
 *
 * @param {*} servicesManager
 * @param {*} dataSource
 * @param {*} measurements
 * @param {*} options
 * @returns {string[]} displaySetInstanceUIDs
 */
async function createReportAsync(
  servicesManager,
  dataSource,
  measurements,
  options
) {
  const {
    DisplaySetService,
    UINotificationService,
    UIDialogService,
  } = servicesManager.services;
  const loadingDialogId = UIDialogService.create({
    showOverlay: true,
    isDraggable: false,
    centralize: true,
    // TODO: Create a loading indicator component + zeplin design?
    content: Loading,
  });

  try {
    const naturalizedReport = await DICOMSR.storeMeasurements(
      measurements,
      dataSource,
      ['ArrowAnnotate'],
      options
    );

    // The "Mode" route listens for DicomMetadataStore changes
    // When a new instance is added, it listens and
    // automatically calls makeDisplaySets
    // We NEED the displaySetInstanceUID in this case, so we
    // silence the DICOM Metadata Store's broadcast
    const silent = true;
    DicomMetadataStore.addInstances([naturalizedReport], silent);

    const displaySetInstanceUIDs = DisplaySetService.makeDisplaySets(
      [naturalizedReport],
      {
        madeInClient: true,
      }
    );

    UINotificationService.show({
      title: 'Create Report',
      message: 'Measurements saved successfully',
      type: 'success',
    });

    return displaySetInstanceUIDs;
  } catch (error) {
    UINotificationService.show({
      title: 'Create Report',
      message: error.message || 'Failed to store measurements',
      type: 'error',
    });
  } finally {
    UIDialogService.dismiss({ id: loadingDialogId });
  }
}

function Loading() {
  return <div className="text-primary-active">Loading...</div>;
}

export default createReportAsync;
