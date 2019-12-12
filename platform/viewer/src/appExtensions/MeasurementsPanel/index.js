import React from 'react';
import ConnectedMeasurementTable from './ConnectedMeasurementTable.js';
import init from './init.js';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'measurements-table',

  preRegistration({ servicesManager, commandsManager, configuration = {} }) {
    init({ servicesManager, commandsManager, configuration });
  },

  getPanelModule({ servicesManager, commandsManager }) {
    const { UILabellingFlowService, UINotificationService } = servicesManager.services;
    const ExtendedConnectedMeasurementTable = () => (
      <ConnectedMeasurementTable
        onRelabel={tool => {
          if (UILabellingFlowService) {
            UILabellingFlowService.show({
              centralize: true,
              props: {
                skipAddLabelButton: true,
                editLocation: true,
                measurementData: tool,
              },
            });
          }
        }}
        onEditDescription={tool => {
          if (UILabellingFlowService) {
            UILabellingFlowService.show({
              centralize: true,
              props: {
                editDescriptionOnDialog: true,
                measurementData: tool,
              },
            });
          }
        }}
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
