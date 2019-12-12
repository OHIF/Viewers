import React from 'react';
import ConnectedMeasurementTable from './ConnectedMeasurementTable.js';
import init from './init.js';

import { LabellingManager } from '@ohif/viewer';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'measurements-table',

  preRegistration({ servicesManager, commandsManager, configuration = {} }) {
    init({ servicesManager, commandsManager, configuration });
  },
  getPanelModule({ servicesManager, commandsManager }) {
    const _updateLabellingHandler = (labellingData, measurementData) => {
      const { location, description, response } = labellingData;

      if (location) {
        measurementData.location = location;
      }

      measurementData.description = description || '';

      if (response) {
        measurementData.response = response;
      }

      commandsManager.runCommand(
        'updateTableWithNewMeasurementData',
        measurementData
      );
    };

    const { UIDialogService } = servicesManager.services;
    const ExtendedConnectedMeasurementTable = () => (
      <ConnectedMeasurementTable
        onRelabel={tool => {
          if (UIDialogService) {
            UIDialogService.dismiss({ id: 'labelling' });
            UIDialogService.create({
              id: 'labelling',
              centralize: true,
              isDraggable: false,
              showOverlay: true,
              content: LabellingManager,
              contentProps: {
                editLocation: true,
                measurementData: tool,
                skipAddLabelButton: true,
                labellingDoneCallback: () =>
                  UIDialogService.dismiss({ id: 'labelling' }),
                updateLabelling: labellingData =>
                  _updateLabellingHandler(labellingData, tool),
              },
            });
          }
        }}
        onEditDescription={tool => {
          if (UIDialogService) {
            UIDialogService.dismiss({ id: 'labelling' });
            UIDialogService.create({
              id: 'labelling',
              centralize: true,
              isDraggable: false,
              showOverlay: true,
              content: LabellingManager,
              contentProps: {
                editDescriptionOnDialog: true,
                measurementData: tool,
                labellingDoneCallback: () =>
                  UIDialogService.dismiss({ id: 'labelling' }),
                updateLabelling: labellingData =>
                  _updateLabellingHandler(labellingData, tool),
              },
            });
          }
        }}
      />
    );
    return {
      menuOptions: [
        {
          icon: 'list',
          label: 'Measurements',
          target: 'measurement-panel',
        },
      ],
      components: [
        {
          id: 'measurement-panel',
          component: ExtendedConnectedMeasurementTable,
        },
      ],
      defaultContext: ['VIEWER'],
    };
  },
};
