import { id } from './id';
import { hotkeys } from '@ohif/core';
import initToolGroups from './initToolGroups';
import toolbarButtons from './toolbarButtons';

const REQUIRED_MODALITIES = ['PT', 'CT'];

const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-cornerstone-dynamic-volume': '^1.0.0',
};

const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  hangingProtocol: '@ohif/extension-default.hangingProtocolModule.default',
  leftPanel: '@ohif/extension-default.panelModule.seriesList',
  rightPanel: '@ohif/extension-default.panelModule.measure',
};

const dynamicVolume = {
  leftPanel:
    '@ohif/extension-cornerstone-dynamic-volume.panelModule.dynamic-volume',
};

const cornerstone = {
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
};

function modeFactory({ modeConfiguration }) {
  return {
    id,
    routeName: 'dynamic-volume',
    displayName: '4D Volume',
    onModeEnter: function({
      servicesManager,
      extensionManager,
      commandsManager,
    }) {
      const {
        measurementService,
        toolbarService,
        toolGroupService,
      } = servicesManager.services;

      const utilityModule = extensionManager.getModuleEntry(
        '@ohif/extension-cornerstone.utilityModule.tools'
      );

      const { toolNames, Enums } = utilityModule.exports;

      measurementService.clearMeasurements();
      initToolGroups({ toolNames, Enums, toolGroupService, commandsManager });

      toolbarService.init(extensionManager);
      toolbarService.addButtons(toolbarButtons);
      toolbarService.createButtonSection('primary', [
        'MeasurementTools',
        'Zoom',
        'WindowLevel',
        'Crosshairs',
        'Pan',
        'RectangleROIStartEndThreshold',
        'fusionPTColormap',
        'Cine',
      ]);
    },
    onModeExit: ({ servicesManager }) => {
      const {
        toolGroupService,
        syncGroupService,
        segmentationService,
        cornerstoneViewportService,
      } = servicesManager.services;

      toolGroupService.destroy();
      syncGroupService.destroy();
      segmentationService.destroy();
      cornerstoneViewportService.destroy();
    },
    get validationTags() {
      return {
        study: [],
        series: [],
      };
    },
    isValidMode: ({ modalities }) => {
      const modalities_list = modalities.split('\\');

      return REQUIRED_MODALITIES.every(modality =>
        modalities_list.includes(modality)
      );
    },
    workflow: {
      // initialStageId: 'registration',
      stages: [
        {
          id: 'dataPreparation',
          name: 'Data Preparation',
          // toolbar: {
          //   buttons: dataPreparationToolbarButtons,
          //   sections: [
          //     {
          //       key: 'primary',
          //       buttons: [ 'MeasurementTools', 'Zoom', ... ],
          //     },
          //   ],
          // },
          // layout: {
          //   panels: {
          //     left: [dynamicVolume.leftPanel],
          //     right: [ohif.rightPanel],
          //   },
          // },
          hangingProtocol: {
            protocolId: 'default4D',
            stageId: 'dataPreparation',
          },
        },
        {
          id: 'registration',
          name: 'Registration',
          hangingProtocol: {
            protocolId: 'default4D',
            stageId: 'registration',
          },
        },
        {
          id: 'review',
          name: 'Review',
          hangingProtocol: {
            protocolId: 'default4D',
            stageId: 'review',
          },
        },
        {
          id: 'roiQuantification',
          name: 'ROI Quantification',
          hangingProtocol: {
            protocolId: 'default4D',
            stageId: 'roiQuantification',
          },
        },
        {
          id: 'kineticAnalysis',
          name: 'Kinect Analysis',
          hangingProtocol: {
            protocolId: 'default4D',
            stageId: 'kinectAnalysis',
          },
        },
      ],
    },
    /**
     * Mode Routes are used to define the mode's behavior. A list of Mode Route
     * that includes the mode's path and the layout to be used. The layout will
     * include the components that are used in the layout. For instance, if the
     * default layoutTemplate is used (id: '@ohif/extension-default.layoutTemplateModule.viewerLayout')
     * it will include the leftPanels, rightPanels, and viewports. However, if
     * you define another layoutTemplate that includes a Footer for instance,
     * you should provide the Footer component here too. Note: We use Strings
     * to reference the component's ID as they are registered in the internal
     * ExtensionManager. The template for the string is:
     * `${extensionId}.{moduleType}.${componentId}`.
     */
    routes: [
      {
        path: 'preclinical-4d',
        layoutTemplate: ({ location, servicesManager }) => {
          return {
            id: ohif.layout,
            props: {
              leftPanels: [dynamicVolume.leftPanel],
              rightPanels: [ohif.rightPanel],
              rightPanelDefaultClosed: true,
              viewports: [
                {
                  namespace: cornerstone.viewport,
                  displaySetsToDisplay: [ohif.sopClassHandler],
                },
              ],
            },
          };
        },
      },
    ],
    extensions: extensionDependencies,
    // Default protocol gets self-registered by default in the init
    hangingProtocol: ['default4D'],
    // Order is important in sop class handlers when two handlers both use
    // the same sop class under different situations.  In that case, the more
    // general handler needs to come last.  For this case, the dicomvideo must
    // come first to remove video transfer syntax before ohif uses images
    sopClassHandlers: [ohif.sopClassHandler],
    hotkeys: [...hotkeys.defaults.hotkeyBindings],
  };
}

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;
