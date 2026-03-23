import React from 'react';
import SmartPaintTool from './tools/SmartPaintTool';

const SmartPaintExtension = {
  id: '@custom/extension-smart-paint',

  preRegistration({ servicesManager }) {
    // No custom services needed
  },

  onModeEnter({ servicesManager }) {},
  onModeExit({ servicesManager }) {},

  /**
   * getPanelModule — Smart Paint panel visible in the right panel area.
   */
  getPanelModule({ servicesManager, commandsManager }) {
    return [
      {
        name: 'smartPaint',
        iconName: 'tab-segmentation',
        iconLabel: 'Smart Paint',
        label: 'Smart Paint ROI',
        component: React.lazy(() => import('./panels/PanelSmartPaint')),
      },
    ];
  },

  /**
   * getToolbarModule — toolbar button for Smart Paint.
   */
  getToolbarModule({ commandsManager }) {
    return [
      {
        name: 'ohif.smartPaint',
        defaultComponent: 'ToolbarButton',
        props: {
          label: 'Smart Paint',
          icon: 'tool-freehand-roi',
          commands: [{ commandName: 'activateSmartPaint' }],
        },
      },
    ];
  },

  getCommandsModule({ servicesManager }) {
    return {
      definitions: {
        activateSmartPaint: {
          commandFn: () => {
            console.log('[SmartPaint] Tool activated');
          },
          storeContexts: [],
          options: {},
        },
      },
      defaultContext: 'DEFAULT',
    };
  },

  /**
   * getUtilityModule — export the tool for other extensions to use.
   */
  getUtilityModule() {
    return [
      {
        name: 'SmartPaintTool',
        exports: { SmartPaintTool },
      },
    ];
  },
};

export default SmartPaintExtension;
