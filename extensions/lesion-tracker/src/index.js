import React, { useState, useEffect } from 'react';

import asyncComponent from './asyncComponent.js';

const MeasurementComparisonTable = asyncComponent(() =>
  import(
    /* webpackChunkName: "MeasurementComparisonTable" */ './components/MeasurementComparisonTable'
  )
);

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'lesion-tracker',

  /**
   * @param {object} params
   * @param {ServicesManager} params.servicesManager
   * @param {CommandsManager} params.commandsManager
   */
  getPanelModule({ servicesManager, commandsManager }) {
    const {
      UINotificationService,
      MeasurementService,
    } = servicesManager.services;

    const {
      MEASUREMENT_ADDED,
      MEASUREMENT_UPDATED,
      MEASUREMENT_REMOVED,
    } = MeasurementService.EVENTS;

    const ExtendedMeasurementComparisonTable = () => {
      const [measurements, setMeasurements] = useState([]);

      const updateMeasurements = () => {
        const measurements = MeasurementService.getMeasurements();
        setMeasurements(measurements);
      };

      useEffect(() => {
        updateMeasurements();

        MeasurementService.subscribe(MEASUREMENT_ADDED, () => {
          updateMeasurements();
          UINotificationService.show({
            title: 'Lesion Tracker Comparison Table',
            message: 'Measurement added, updating measurement table.',
          });
        });

        [MEASUREMENT_UPDATED, MEASUREMENT_REMOVED].forEach(event => {
          MeasurementService.subscribe(event, () => updateMeasurements());
        });
      }, []);

      return (
        <MeasurementComparisonTable
          measurements={measurements}
          onItemClick={(event, measurementData) => {
            const measurement = measurements.find(m => m.id === measurementData.measurementId);
            commandsManager.runCommand('jumpToImage', {
              sopInstanceUid: measurement.sopInstanceUID,
              frameIndex: measurement.frameNumber,
              studyInstanceUid: measurement.studyInstanceUID,
            });
          }}
        />
      );
    };

    return {
      menuOptions: [
        {
          icon: 'th-list',
          label: 'Measurements',
          target: 'lesion-tracker-panel',
        },
      ],
      components: [
        {
          id: 'lesion-tracker-panel',
          component: ExtendedMeasurementComparisonTable,
        },
      ],
      defaultContext: ['VIEWER']
    };
  },

  /**
   * @param {object} params
   * @param {ServicesManager} params.servicesManager
   * @param {CommandsManager} params.commandsManager
   * @returns Object
   */
  getToolbarModule() {
    return null;
  },

  /**
   * @param {object} params
   * @param {ServicesManager} params.servicesManager
   * @param {CommandsManager} params.commandsManager
   * @returns Object
   */
  getCommandsModule() {
    return null;
  },
};
