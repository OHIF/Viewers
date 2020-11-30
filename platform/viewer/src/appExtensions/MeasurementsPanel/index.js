import React from 'react';
import ConnectedMeasurementTable from './ConnectedMeasurementTable.js';
import init from './init.js';

import LabellingFlow from '../../components/Labelling/LabellingFlow';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'measurements-table',
  get version() {
    return window.version;
  },

  preRegistration({ servicesManager, commandsManager, configuration = {} }) {
    init({ servicesManager, commandsManager, configuration });
  },

  getPanelModule({ servicesManager, commandsManager }) {
    const { UINotificationService, UIDialogService } = servicesManager.services;

    const showLabellingDialog = (props, measurementData) => {
      if (!UIDialogService) {
        console.warn('Unable to show dialog; no UI Dialog Service available.');
        return;
      }

      UIDialogService.dismiss({ id: 'labelling' });
      UIDialogService.create({
        id: 'labelling',
        centralize: true,
        isDraggable: false,
        showOverlay: true,
        content: LabellingFlow,
        contentProps: {
          measurementData,
          labellingDoneCallback: () =>
            UIDialogService.dismiss({ id: 'labelling' }),
          updateLabelling: ({ location, description, response }) => {
            measurementData.location = location || measurementData.location;
            measurementData.description = description || '';
            measurementData.response = response || measurementData.response;

            commandsManager.runCommand(
              'updateTableWithNewMeasurementData',
              measurementData
            );
          },
          ...props,
        },
      });
    };

    const ExtendedConnectedMeasurementTable = () => (
      <ConnectedMeasurementTable
        onRelabel={tool =>
          showLabellingDialog(
            { editLocation: true, skipAddLabelButton: true },
            tool
          )
        }
        onEditDescription={tool =>
          showLabellingDialog({ editDescriptionOnDialog: true }, tool)
        }
        onSaveComplete={message => {
          if (UINotificationService) {
            UINotificationService.show(message);
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
