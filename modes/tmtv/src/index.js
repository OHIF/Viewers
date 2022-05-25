import { hotkeys } from '@ohif/core';
import toolbarButtons from './toolbarButtons.js';
import { id } from './id.js';
import initToolGroups, { toolGroupIds } from './initToolGroups.js';

const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  hangingProtocols: '@ohif/extension-default.hangingProtocolModule.default',
  measurements: '@ohif/extension-default.panelModule.measure',
  thumbnailList: '@ohif/extension-default.panelModule.seriesList',
};

const cs3d = {
  viewport: '@ohif/extension-cornerstone-3d.viewportModule.cornerstone-3d',
};

const tmtv = {
  hangingProtocols: '@ohif/extension-tmtv.hangingProtocolModule.ptCT',
  petSUV: '@ohif/extension-tmtv.panelModule.petSUV',
};

const extensionDependencies = {
  // Can derive the versions at least process.env.from npm_package_version
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone-3d': '^3.0.0',
  '@ohif/extension-tmtv': '^3.0.0',
};

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
    onModeEnter: ({ servicesManager, extensionManager }) => {
      const {
        ToolBarService,
        ToolGroupService,
        HangingProtocolService,
        DisplaySetService,
      } = servicesManager.services;

      const utilityModule = extensionManager.getModuleEntry(
        '@ohif/extension-cornerstone-3d.utilityModule.tools'
      );

      const { toolNames, Enums } = utilityModule.exports;

      // Init Default and SR ToolGroups
      initToolGroups(toolNames, Enums, ToolGroupService);

      let unsubscribe;

      const activateTool = () => {
        ToolBarService.recordInteraction({
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
              context: 'CORNERSTONE3D',
            },
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: toolNames.WindowLevel,
                toolGroupId: toolGroupIds.PT,
              },
              context: 'CORNERSTONE3D',
            },
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: toolNames.WindowLevel,
                toolGroupId: toolGroupIds.Fusion,
              },
              context: 'CORNERSTONE3D',
            },
          ],
        });

        // For fusion toolGroup we need to add the volumeIds for the crosshairs
        // since in the fusion viewport we don't want both PT and CT to render MIP
        // when slabThickness is modified
        const matches = HangingProtocolService.getDisplaySetsMatchDetails();

        // Todo: we are tying the displaySetId (in the hangingProtocols)
        // to the modes. Maybe the HangingProtocols should be set at the mode
        // level (not extension level?)
        const { SeriesInstanceUID } = matches.get('ctDisplaySet');
        const displaySets = DisplaySetService.getDisplaySetsForSeries(
          SeriesInstanceUID
        );

        const toolConfig = ToolGroupService.getToolConfiguration(
          toolGroupIds.Fusion,
          toolNames.Crosshairs
        );

        const crosshairsConfig = {
          ...toolConfig,
          actorUIDsForSlabThickness: [displaySets[0].displaySetInstanceUID],
        };

        ToolGroupService.setToolConfiguration(
          toolGroupIds.Fusion,
          toolNames.Crosshairs,
          crosshairsConfig
        );

        // We don't need to reset the active tool whenever a viewport is getting
        // added to the toolGroup.
        unsubscribe();
      };

      // Since we only have one viewport for the basic cs3d mode and it has
      // only one hanging protocol, we can just use the first viewport
      ({ unsubscribe } = ToolGroupService.subscribe(
        ToolGroupService.EVENTS.VIEWPORT_ADDED,
        activateTool
      ));

      ToolBarService.init(extensionManager);
      ToolBarService.addButtons(toolbarButtons);
      ToolBarService.createButtonSection('primary', [
        'MeasurementTools',
        'Zoom',
        'WindowLevel',
        'Crosshairs',
        'Pan',
      ]);
    },
    onModeExit: ({ servicesManager }) => {
      const {
        ToolGroupService,
        SyncGroupService,
        MeasurementService,
        ToolBarService,
      } = servicesManager.services;

      ToolBarService.reset();
      MeasurementService.clearMeasurements();
      ToolGroupService.destroy();
      SyncGroupService.destroy();
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
              leftPanels: [],
              rightPanels: [tmtv.petSUV],
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
    hangingProtocols: [ohif.hangingProtocols, tmtv.hangingProtocols],
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
