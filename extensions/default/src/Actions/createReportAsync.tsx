import React from 'react';
import { DicomMetadataStore } from '@ohif/core';

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
  commandsManager,
  dataSource,
  measurements,
  options
) {
  const {
    displaySetService,
    uiNotificationService,
    uiDialogService,
  } = servicesManager.services;
  const loadingDialogId = uiDialogService.create({
    showOverlay: true,
    isDraggable: false,
    centralize: true,
    // TODO: Create a loading indicator component + zeplin design?
    content: Loading,
  });

  try {
    const naturalizedReport = await commandsManager.runCommand(
      'storeMeasurements',
      {
        measurementData: measurements,
        dataSource,
        additionalFindingTypes: ['ArrowAnnotate'],
        options,
      },
      'CORNERSTONE_STRUCTURED_REPORT'
    );

    // The "Mode" route listens for DicomMetadataStore changes
    // When a new instance is added, it listens and
    // automatically calls makeDisplaySets
    DicomMetadataStore.addInstances([naturalizedReport], true);

    const displaySetInstanceUID = displaySetService.getMostRecentDisplaySet();

    uiNotificationService.show({
      title: 'Create Report',
      message: 'Measurements saved successfully',
      type: 'success',
    });

    return [displaySetInstanceUID];
  } catch (error) {
    uiNotificationService.show({
      title: 'Create Report',
      message: error.message || 'Failed to store measurements',
      type: 'error',
    });
  } finally {
    uiDialogService.dismiss({ id: loadingDialogId });
  }
}

function Loading() {
  return <div className="text-primary-active">Loading...</div>;
}

export default createReportAsync;
