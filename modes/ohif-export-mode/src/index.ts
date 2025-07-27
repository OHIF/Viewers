import i18n from 'i18next';

const id = '@ohif/mode-export';

// Define constants for referencing extensions and modules
const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  measurements: '@ohif/extension-cornerstone.panelModule.panelMeasurement',
  thumbnailList: '@ohif/extension-default.panelModule.seriesList',
};

const cs3d = {
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
};

const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-export': '^1.0.0', // Your export extension
};

interface ModeFactoryParams {
  modeConfiguration?: any;
}

interface ServicesManager {
  services: {
    toolbarService: any;
    toolGroupService: any;
    uiDialogService: any;
    uiModalService: any;
  };
}

interface ExtensionManager {
  getModuleEntry: (moduleId: string) => any;
}

interface ModeContext {
  servicesManager: ServicesManager;
  extensionManager: ExtensionManager;
}

function modeFactory({ modeConfiguration }: ModeFactoryParams = {}) {
  return {
    id,
    routeName: 'export',
    displayName: i18n.t('Export Mode'),

    /**
     * Lifecycle hooks
     */
    onModeEnter: ({ servicesManager, extensionManager }: ModeContext) => {
      const { toolbarService, toolGroupService } = servicesManager.services;

      // Get cornerstone tools
      const utilityModule = extensionManager.getModuleEntry(
        '@ohif/extension-cornerstone.utilityModule.tools'
      );

      const { toolNames, Enums } = utilityModule.exports;

      // Configure basic tools for image interaction
      const tools = {
        active: [
          {
            toolName: toolNames.WindowLevel,
            bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
          },
          {
            toolName: toolNames.Pan,
            bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
          },
          {
            toolName: toolNames.Zoom,
            bindings: [{ mouseButton: Enums.MouseBindings.Secondary }, { numTouchPoints: 2 }],
          },
          {
            toolName: toolNames.StackScroll,
            bindings: [{ mouseButton: Enums.MouseBindings.Wheel }, { numTouchPoints: 3 }],
          },
        ],
        passive: [
          { toolName: toolNames.Length },
          { toolName: toolNames.Bidirectional },
          { toolName: toolNames.Probe },
          { toolName: toolNames.EllipticalROI },
          { toolName: toolNames.CircleROI },
          { toolName: toolNames.RectangleROI },
          { toolName: toolNames.StackScroll },
        ],
        enabled: [{ toolName: toolNames.ImageOverlayViewer }],
      };

      toolGroupService.createToolGroupAndAddTools('export-mode', tools);

      // Configure toolbar with your export button
      toolbarService.updateSection('primary', [
        'WindowLevel',
        'Zoom',
        'Pan',
        'Layout',
        'ExportZip', // Your export button
      ]);
    },

    onModeExit: ({ servicesManager }: ModeContext) => {
      const { toolGroupService, uiDialogService, uiModalService } = servicesManager.services;
      uiDialogService.hideAll();
      uiModalService.hide();
      toolGroupService.destroy();
    },

    validationTags: {
      study: [],
      series: [],
    },

    isValidMode: ({ modalities }: { modalities: string }) => {
      const modalitiesList = modalities.split('\\');

      // This mode supports most modalities
      return {
        valid: !modalitiesList.includes('SM'), // Exclude slide microscopy for now
        description: 'Export mode supports most medical imaging modalities except SM (Slide Microscopy)',
      };
    },

    routes: [
      {
        path: 'export',
        layoutTemplate: ({ location, servicesManager }: any) => {
          return {
            id: ohif.layout,
            props: {
              leftPanels: [ohif.thumbnailList],
              leftPanelResizable: true,
              rightPanels: [ohif.measurements],
              rightPanelResizable: true,
              viewports: [
                {
                  namespace: cs3d.viewport,
                  displaySetsToDisplay: [ohif.sopClassHandler],
                },
              ],
            },
          };
        },
      },
    ],

    extensions: extensionDependencies,
    hangingProtocol: 'default',
    sopClassHandlers: [ohif.sopClassHandler],
  };
}

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;

export { id };
