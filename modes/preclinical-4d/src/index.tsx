import { id } from './id';
import initWorkflowSteps from './initWorkflowSteps';
import initToolGroups from './initToolGroups';
import toolbarButtons from './toolbarButtons';

const extensionDependencies = {
  '@ohif/extension-default': '3.7.0-beta.76',
  '@ohif/extension-cornerstone': '3.7.0-beta.76',
  '@ohif/extension-cornerstone-dynamic-volume': '3.7.0-beta.76',
  '@ohif/extension-cornerstone-dicom-seg': '3.7.0-beta.76',
  '@ohif/extension-tmtv': '3.7.0-beta.76',
};

const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  defaultSopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  chartSopClassHandler: '@ohif/extension-default.sopClassHandlerModule.chart',
  hangingProtocol: '@ohif/extension-default.hangingProtocolModule.default',
  leftPanel: '@ohif/extension-default.panelModule.seriesList',
  chartViewport: '@ohif/extension-default.viewportModule.chartViewport',
};

const dynamicVolume = {
  leftPanel: '@ohif/extension-cornerstone-dynamic-volume.panelModule.dynamic-volume',
};

const cornerstone = {
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
  activeViewportWindowLevel: '@ohif/extension-cornerstone.panelModule.activeViewportWindowLevel',
};

function modeFactory({ modeConfiguration }) {
  return {
    id,
    routeName: 'dynamic-volume',
    displayName: 'Preclinical 4D',
    onModeEnter: function ({ servicesManager, extensionManager, commandsManager }: withAppTypes) {
      const {
        measurementService,
        toolbarService,
        cineService,
        cornerstoneViewportService,
        toolGroupService,
        customizationService,
        viewportGridService,
      } = servicesManager.services;

      const utilityModule = extensionManager.getModuleEntry(
        '@ohif/extension-cornerstone.utilityModule.tools'
      );

      const { toolNames, Enums } = utilityModule.exports;

      measurementService.clearMeasurements();
      initToolGroups({ toolNames, Enums, toolGroupService, commandsManager, servicesManager });

      toolbarService.register(toolbarButtons);

      toolbarService.updateSection(toolbarService.sections.secondary, ['ProgressDropdown']);

      toolbarService.updateSection(toolbarService.sections.viewportActionMenu.topLeft, [
        'orientationMenu',
        'dataOverlayMenu',
      ]);

      toolbarService.updateSection(toolbarService.sections.viewportActionMenu.topLeft, [
        'orientationMenu',
        'dataOverlayMenu',
      ]);

      toolbarService.updateSection(toolbarService.sections.viewportActionMenu.bottomMiddle, [
        'AdvancedRenderingControls',
      ]);

      toolbarService.updateSection('AdvancedRenderingControls', [
        'windowLevelMenuEmbedded',
        'voiManualControlMenu',
        'Colorbar',
        'opacityMenu',
        'thresholdMenu',
      ]);

      toolbarService.updateSection(toolbarService.sections.viewportActionMenu.topRight, [
        'modalityLoadBadge',
        'trackingStatus',
        'navigationComponent',
      ]);

      toolbarService.updateSection(toolbarService.sections.viewportActionMenu.bottomLeft, [
        'windowLevelMenu',
      ]);

      // the primary button section is created in the workflow steps
      // specific to the step
      customizationService.setCustomizations({
        'panelSegmentation.tableMode': {
          $set: 'expanded',
        },
        'panelSegmentation.onSegmentationAdd': {
          $set: () => {
            commandsManager.run('createNewLabelMapForDynamicVolume');
          },
        },
        'panelSegmentation.showAddSegment': {
          $set: false,
        },
      });

      // Auto play the clip initially when the volumes are loaded
      const { unsubscribe } = cornerstoneViewportService.subscribe(
        cornerstoneViewportService.EVENTS.VIEWPORT_VOLUMES_CHANGED,
        () => {
          const viewportId = viewportGridService.getActiveViewportId();
          const csViewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
          cineService.playClip(csViewport.element, { viewportId });
          // cineService.setIsCineEnabled(true);

          unsubscribe();
        }
      );
    },
    onSetupRouteComplete: ({ servicesManager }: withAppTypes) => {
      // This needs to run after hanging protocol matching process because
      // it may change the protocol/stage based on workflow stage settings
      initWorkflowSteps({ servicesManager });
    },
    onModeExit: ({ servicesManager }: withAppTypes) => {
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
    isValidMode: ({ modalities, study }) => {
      // Todo: we need to find a better way to validate the mode
      return {
        valid: study.mrn === 'M1',
        description: 'This mode is only available for 4D PET/CT studies.',
      };
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
              leftPanels: [[dynamicVolume.leftPanel, cornerstone.activeViewportWindowLevel]],
              leftPanelResizable: true,
              rightPanels: [],
              rightPanelResizable: true,
              rightPanelClosed: true,
              viewports: [
                {
                  namespace: cornerstone.viewport,
                  displaySetsToDisplay: [ohif.defaultSopClassHandler],
                },
                {
                  namespace: ohif.chartViewport,
                  displaySetsToDisplay: [ohif.chartSopClassHandler],
                },
              ],
            },
          };
        },
      },
    ],
    extensions: extensionDependencies,
    // Default protocol gets self-registered by default in the init
    hangingProtocol: 'default4D',
    // Order is important in sop class handlers when two handlers both use
    // the same sop class under different situations.  In that case, the more
    // general handler needs to come last.  For this case, the dicomvideo must
    // come first to remove video transfer syntax before ohif uses images
    sopClassHandlers: [ohif.chartSopClassHandler, ohif.defaultSopClassHandler],
  };
}

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;
