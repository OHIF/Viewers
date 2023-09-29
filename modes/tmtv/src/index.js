import { hotkeys, classes } from '@ohif/core';
import toolbarButtons from './toolbarButtons.js';
import { id } from './id.js';
import initToolGroups, { toolGroupIds } from './initToolGroups.js';
import setCrosshairsConfiguration from './utils/setCrosshairsConfiguration.js';
import setFusionActiveVolume from './utils/setFusionActiveVolume.js';

const { MetadataProvider } = classes;

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
      const { toolbarService, toolGroupService, hangingProtocolService, displaySetService } =
        servicesManager.services;

      const utilityModule = extensionManager.getModuleEntry(
        '@ohif/extension-cornerstone.utilityModule.tools'
      );

      const { toolNames, Enums } = utilityModule.exports;

      // Init Default and SR ToolGroups
      initToolGroups(toolNames, Enums, toolGroupService, commandsManager);

      const setWindowLevelActive = () => {
        toolbarService.recordInteraction({
          groupId: 'WindowLevel',
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

      const { unsubscribe } = toolGroupService.subscribe(
        toolGroupService.EVENTS.VIEWPORT_ADDED,
        () => {
          // For fusion toolGroup we need to add the volumeIds for the crosshairs
          // since in the fusion viewport we don't want both PT and CT to render MIP
          // when slabThickness is modified
          const { displaySetMatchDetails } = hangingProtocolService.getMatchDetails();

          setCrosshairsConfiguration(
            displaySetMatchDetails,
            toolNames,
            toolGroupService,
            displaySetService
          );

          setFusionActiveVolume(
            displaySetMatchDetails,
            toolNames,
            toolGroupService,
            displaySetService
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

      // For the hanging protocol we need to decide on the window level
      // based on whether the SUV is corrected or not, hence we can't hard
      // code the window level in the hanging protocol but we add a custom
      // attribute to the hanging protocol that will be used to get the
      // window level based on the metadata
      hangingProtocolService.addCustomAttribute(
        'getPTVOIRange',
        'get PT VOI based on corrected or not',
        props => {
          const ptDisplaySet = props.find(imageSet => imageSet.Modality === 'PT');

          if (!ptDisplaySet) {
            return;
          }

          const { imageId } = ptDisplaySet.images[0];
          const imageIdScalingFactor = MetadataProvider.get('scalingModule', imageId);

          const isSUVAvailable = imageIdScalingFactor && imageIdScalingFactor.suvbw;

          if (isSUVAvailable) {
            return {
              windowWidth: 5,
              windowCenter: 2.5,
            };
          }

          return;
        }
      );
    },
    onModeExit: ({ servicesManager }) => {
      const {
        toolGroupService,
        syncGroupService,
        segmentationService,
        cornerstoneViewportService,
      } = servicesManager.services;

      unsubscriptions.forEach(unsubscribe => unsubscribe());
      toolGroupService.destroy();
      syncGroupService.destroy();
      segmentationService.destroy();
      cornerstoneViewportService.destroy();
    },
    validationTags: {
      study: [],
      series: [],
    },
    isValidMode: ({ modalities, study }) => {
      const modalities_list = modalities.split('\\');
      const invalidModalities = ['SM'];

      const isValid =
        modalities_list.includes('CT') &&
        modalities_list.includes('PT') &&
        !invalidModalities.some(modality => modalities_list.includes(modality)) &&
        // This is study is a 4D study with PT and CT and not a 3D study for the tmtv
        // mode, until we have a better way to identify 4D studies we will use the
        // StudyInstanceUID to identify the study
        // Todo: when we add the 4D mode which comes with a mechanism to identify
        // 4D studies we can use that
        study.studyInstanceUid !== '1.3.6.1.4.1.12842.1.1.14.3.20220915.105557.468.2963630849';

      // there should be both CT and PT modalities and the modality should not be SM
      return isValid;
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
              leftPanels: [ohif.thumbnailList],
              leftPanelDefaultClosed: true,
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
    ...modeConfiguration,
  };
}

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;
