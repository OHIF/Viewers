import React from 'react';

const FlatfootExtension = {
  id: '@custom/extension-flatfoot',

  preRegistration({ servicesManager }) {},
  onModeEnter({ servicesManager }) {},
  onModeExit({ servicesManager }) {},

  getPanelModule({ servicesManager, commandsManager }) {
    return [
      {
        name: 'flatfootMeasurement',
        iconName: 'tool-length',
        iconLabel: 'Flatfoot',
        label: 'Flatfoot Measurement',
        component: React.lazy(() => import('./panels/PanelFlatfoot')),
      },
    ];
  },

  getToolbarModule({ commandsManager }) {
    return [
      {
        name: 'ohif.openFlatfoot',
        defaultComponent: 'ToolbarButton',
        props: {
          label: 'Flatfoot Analysis',
          icon: 'tool-length',
          commands: [{ commandName: 'openFlatfootPanel' }],
        },
      },
    ];
  },

  getCommandsModule({ servicesManager }) {
    return {
      definitions: {
        openFlatfootPanel: {
          commandFn: () => {
            console.log('[Flatfoot] Panel activated');
          },
          storeContexts: [],
          options: {},
        },
      },
      defaultContext: 'DEFAULT',
    };
  },
};

export default FlatfootExtension;
