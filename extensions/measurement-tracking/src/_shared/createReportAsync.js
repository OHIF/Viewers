import React from 'react';
import { DICOMSR } from '@ohif/core';

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
    UINotificationService,
    UIDialogService,
    DisplaySetService,
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
