import { hotkeys } from '@ohif/core';
import toolbarButtons from './toolbarButtons.js';
import { id } from './id.js';
import initToolGroups, { toolGroupIds } from './initToolGroups.js';
import setCrosshairsConfiguration from './utils/setCrosshairsConfiguration.js';
import setFusionActiveVolume from './utils/setFusionActiveVolume.js';

const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  measurements: '@ohif/extension-default.panelModule.measure',
  thumbnailList: '@ohif/extension-default.panelModule.seriesList',
};

const cs3d = {
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
};

const tmtv = {
  hangingProtocol: '@ohif/extension-tmtv.hangingProtocolModule.ptCT',
  petSUV: '@ohif/extension-tmtv.panelModule.petSUV',
  ROIThresholdPanel: '@ohif/extension-tmtv.panelModule.ROIThresholdSeg',
};

const extensionDependencies = {
  // Can derive the versions at least process.env.from npm_package_version
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-tmtv': '^3.0.0',
};

let unsubscriptions = [];
function modeFactory({ modeConfiguration }) {
  return {
    // TODO: We're using this as a route segment
    // We should not be.
    id,
    routeName: 'tmtv',
    displayName: 'Total Metabolic Tumor Volume',
    /**
     * Lifecycle hooks
     */
    onModeEnter: ({ servicesManager, extensionManager, commandsManager }) => {
      const {
        toolbarService,
        ToolGroupService,
        HangingProtocolService,
        DisplaySetService,
      } = servicesManager.services;

      const utilityModule = extensionManager.getModuleEntry(
        '@ohif/extension-cornerstone.utilityModule.tools'
      );

      const { toolNames, Enums } = utilityModule.exports;

      // Init Default and SR ToolGroups
      initToolGroups(toolNames, Enums, ToolGroupService, commandsManager);

      const setWindowLevelActive = () => {
        toolbarService.recordInteraction({
          groupId: 'WindowLevel',
          itemId: 'WindowLevel',
          interactionType: 'tool',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: toolNames.WindowLevel,
                toolGroupId: toolGroupIds.CT,
              },
              context: 'CORNERSTONE',
            },
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: toolNames.WindowLevel,
                toolGroupId: toolGroupIds.PT,
              },
              context: 'CORNERSTONE',
            },
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: toolNames.WindowLevel,
                toolGroupId: toolGroupIds.Fusion,
              },
              context: 'CORNERSTONE',
            },
          ],
        });
      };

      const { unsubscribe } = ToolGroupService.subscribe(
        ToolGroupService.EVENTS.VIEWPORT_ADDED,
        () => {
          // For fusion toolGroup we need to add the volumeIds for the crosshairs
          // since in the fusion viewport we don't want both PT and CT to render MIP
          // when slabThickness is modified
          const {
            displaySetMatchDetails,
          } = HangingProtocolService.getMatchDetails();

          setCrosshairsConfiguration(
            displaySetMatchDetails,
            toolNames,
            ToolGroupService,
            DisplaySetService
          );

          setFusionActiveVolume(
            displaySetMatchDetails,
            toolNames,
            ToolGroupService,
            DisplaySetService
          );

          setWindowLevelActive();
        }
      );

      unsubscriptions.push(unsubscribe);
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
      ]);
    },
    onModeExit: ({ servicesManager }) => {
      const {
        ToolGroupService,
        SyncGroupService,
        toolbarService,
        SegmentationService,
        CornerstoneViewportService,
      } = servicesManager.services;

      unsubscriptions.forEach(unsubscribe => unsubscribe());
      toolbarService.reset();
      ToolGroupService.destroy();
      SyncGroupService.destroy();
      SegmentationService.destroy();
      CornerstoneViewportService.destroy();
    },
    validationTags: {
      study: [],
      series: [],
    },
    isValidMode: ({ modalities }) => {
      const modalities_list = modalities.split('\\');
      const invalidModalities = ['SM'];

      // there should be both CT and PT modalities and the modality should not be SM
      return (
        modalities_list.includes('CT') &&
        modalities_list.includes('PT') &&
        !invalidModalities.some(modality => modalities_list.includes(modality))
      );
    },
    routes: [
      {
        path: 'tmtv',
        /*init: ({ servicesManager, extensionManager }) => {
          //defaultViewerRouteInit
        },*/
        layoutTemplate: ({ location, servicesManager }) => {
          return {
            id: ohif.layout,
            props: {
              // leftPanels: [ohif.thumbnailList],
              rightPanels: [tmtv.ROIThresholdPanel, tmtv.petSUV],
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
    hangingProtocol: tmtv.hangingProtocol,
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
