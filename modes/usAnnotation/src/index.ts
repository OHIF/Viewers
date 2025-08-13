import i18n from 'i18next';
import { id } from './id';
import initToolGroups from './initToolGroups';
import toolbarButtons from './toolbarButtons';
import { UltrasoundPleuraBLineTool } from '@cornerstonejs/tools';
import { showPercentage } from '../../../extensions/usAnnotation/src/PleuraBlinePercentage';

const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  thumbnailList: '@ohif/extension-default.panelModule.seriesList',
  wsiSopClassHandler:
    '@ohif/extension-cornerstone.sopClassHandlerModule.DicomMicroscopySopClassHandler',
};

const cornerstone = {
  measurements: '@ohif/extension-cornerstone.panelModule.panelMeasurement',
  segmentation: '@ohif/extension-cornerstone.panelModule.panelSegmentation',
};

const tracked = {
  measurements: '@ohif/extension-measurement-tracking.panelModule.trackedMeasurements',
  thumbnailList: '@ohif/extension-measurement-tracking.panelModule.seriesList',
  viewport: '@ohif/extension-measurement-tracking.viewportModule.cornerstone-tracked',
};

const dicomsr = {
  sopClassHandler: '@ohif/extension-cornerstone-dicom-sr.sopClassHandlerModule.dicom-sr',
  sopClassHandler3D: '@ohif/extension-cornerstone-dicom-sr.sopClassHandlerModule.dicom-sr-3d',
  viewport: '@ohif/extension-cornerstone-dicom-sr.viewportModule.dicom-sr',
};

const dicomvideo = {
  sopClassHandler: '@ohif/extension-dicom-video.sopClassHandlerModule.dicom-video',
  viewport: '@ohif/extension-dicom-video.viewportModule.dicom-video',
};

const dicompdf = {
  sopClassHandler: '@ohif/extension-dicom-pdf.sopClassHandlerModule.dicom-pdf',
  viewport: '@ohif/extension-dicom-pdf.viewportModule.dicom-pdf',
};

const dicomSeg = {
  sopClassHandler: '@ohif/extension-cornerstone-dicom-seg.sopClassHandlerModule.dicom-seg',
  viewport: '@ohif/extension-cornerstone-dicom-seg.viewportModule.dicom-seg',
};

const dicomPmap = {
  sopClassHandler: '@ohif/extension-cornerstone-dicom-pmap.sopClassHandlerModule.dicom-pmap',
  viewport: '@ohif/extension-cornerstone-dicom-pmap.viewportModule.dicom-pmap',
};

const dicomRT = {
  viewport: '@ohif/extension-cornerstone-dicom-rt.viewportModule.dicom-rt',
  sopClassHandler: '@ohif/extension-cornerstone-dicom-rt.sopClassHandlerModule.dicom-rt',
};

const usAnnotation = {
  panel: '@ohif/extension-ultrasound-pleura-bline.panelModule.USAnnotationPanel',
};

let settingsSaved = {};
const extensionDependencies = {
  // Can derive the versions at least process.env.from npm_package_version
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-measurement-tracking': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-sr': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-seg': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-pmap': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-rt': '^3.0.0',
  '@ohif/extension-dicom-pdf': '^3.0.1',
  '@ohif/extension-dicom-video': '^3.0.1',
  '@ohif/extension-ultrasound-pleura-bline': '^3.0.0',
};

function modeFactory({ modeConfiguration }) {
  let _activatePanelTriggersSubscriptions = [];
  return {
    // TODO: We're using this as a route segment
    // We should not be.
    id,
    routeName: 'usAnnotation',
    displayName: i18n.t('US Pleura B-line Annotations'),
    /**
     * Lifecycle hooks
     */
    onModeEnter: function ({
      servicesManager,
      extensionManager,
      commandsManager,
      appConfig,
    }: withAppTypes) {
      settingsSaved = {
        disableConfirmationPrompts: appConfig?.disableConfirmationPrompts,
        measurementTrackingMode: appConfig?.measurementTrackingMode,
      };
      appConfig.disableConfirmationPrompts = true;
      appConfig.measurementTrackingMode = 'simplified';
      const { measurementService, toolbarService, toolGroupService, customizationService } =
        servicesManager.services;

      measurementService.clearMeasurements();

      // Init Default and SR ToolGroups
      initToolGroups(extensionManager, toolGroupService, commandsManager);

      toolbarService.register(toolbarButtons);
      toolbarService.updateSection(toolbarService.sections.primary, [
        'MeasurementTools',
        'Zoom',
        'Pan',
        'TrackballRotate',
        'WindowLevel',
        'Capture',
        'Layout',
        'Crosshairs',
        'MoreTools',
      ]);

      toolbarService.updateSection(toolbarService.sections.viewportActionMenu.topLeft, [
        'orientationMenu',
        'dataOverlayMenu',
      ]);

      toolbarService.updateSection(toolbarService.sections.viewportActionMenu.bottomMiddle, [
        'AdvancedRenderingControls',
      ]);

      toolbarService.updateSection(toolbarService.sections.advancedRenderingControlsSection, [
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

      toolbarService.updateSection(toolbarService.sections.measurementSection, [
        'Length',
        'Bidirectional',
        'ArrowAnnotate',
        'EllipticalROI',
        'RectangleROI',
        'CircleROI',
        'PlanarFreehandROI',
        'SplineROI',
        'LivewireContour',
      ]);

      toolbarService.updateSection(toolbarService.sections.moreToolsSection, [
        'Reset',
        'rotate-right',
        'flipHorizontal',
        'ImageSliceSync',
        'ReferenceLines',
        'ImageOverlayViewer',
        'StackScroll',
        'invert',
        'Probe',
        'Cine',
        'Angle',
        'CobbAngle',
        'Magnify',
        'CalibrationLine',
        'TagBrowser',
        'AdvancedMagnify',
        'UltrasoundDirectionalTool',
        'UltrasoundPleuraBLineTool',
        'WindowLevelRegion',
      ]);

      customizationService.setCustomizations(
        {
          'panelSegmentation.disableEditing': {
            $set: true,
          },
          autoCineModalities: {
            $set: [],
          },
          'ohif.hotkeyBindings': {
            $push: [
              {
                commandName: 'switchUSAnnotationToPleuraLine',
                label: 'Add new pleura line',
                keys: ['W'],
              },
              {
                commandName: 'switchUSAnnotationToBLine',
                label: 'Add new B-line',
                keys: ['S'],
              },
              {
                commandName: 'deleteLastPleuraAnnotation',
                label: 'Delete last pleura line',
                keys: ['E'],
              },
              {
                commandName: 'deleteLastBLineAnnotation',
                label: 'Delete last B-line',
                keys: ['D'],
              },
              {
                commandName: 'toggleDisplayFanAnnotation',
                label: 'Toggle overlay',
                keys: ['O'],
              },
            ],
          },
          measurementsContextMenu: {
            inheritsFrom: 'ohif.contextMenu',
            menus: [
              // Get the items from the UI Customization for the menu name (and have a custom name)
              {
                id: 'forExistingMeasurement',
                selector: ({ nearbyToolData }) => !!nearbyToolData,
                items: [
                  {
                    label: 'Delete annotation',
                    commands: 'removeMeasurement',
                  },
                ],
              },
            ],
          },
          'viewportOverlay.topLeft': [
            {
              id: 'BLinePleuraPercentage',
              inheritsFrom: 'ohif.overlayItem',
              label: '',
              title: 'BLinePleuraPercentage',
              condition: ({ referenceInstance }) =>
                referenceInstance?.Modality.includes('US') && showPercentage,
              contentF: () => {
                const { viewportGridService, toolGroupService, cornerstoneViewportService } =
                  servicesManager.services;
                const activeViewportId = viewportGridService.getActiveViewportId();
                const toolGroup = toolGroupService.getToolGroupForViewport(activeViewportId);
                if (!toolGroup) {
                  return 'B-Line/Pleura : N/A';
                }
                const usAnnotation = toolGroup.getToolInstance(UltrasoundPleuraBLineTool.toolName);
                if (usAnnotation) {
                  const viewport =
                    cornerstoneViewportService.getCornerstoneViewport(activeViewportId);
                  const percentage = usAnnotation.calculateBLinePleuraPercentage(viewport);
                  if (percentage !== undefined) {
                    return `B-Line/Pleura : ${percentage.toFixed(2)} %`;
                  } else {
                    return 'B-Line/Pleura : N/A';
                  }
                }
                return 'B-Line/Pleura : N/A';
              },
            },
          ],
        },
        'mode'
      );
    },
    onModeExit: ({ servicesManager }: withAppTypes) => {
      appConfig.disableConfirmationPrompts = settingsSaved.disableConfirmationPrompts;
      appConfig.measurementTrackingMode = settingsSaved.measurementTrackingMode;

      const {
        toolGroupService,
        syncGroupService,
        segmentationService,
        cornerstoneViewportService,
        uiDialogService,
        uiModalService,
      } = servicesManager.services;

      _activatePanelTriggersSubscriptions.forEach(sub => sub.unsubscribe());
      _activatePanelTriggersSubscriptions = [];

      uiDialogService.hideAll();
      uiModalService.hide();
      toolGroupService.destroy();
      syncGroupService.destroy();
      segmentationService.destroy();
      cornerstoneViewportService.destroy();
    },
    validationTags: {
      study: [],
      series: [],
    },

    isValidMode: function ({ modalities }) {
      const modalities_list = modalities.split('\\');

      return {
        valid: modalities_list.includes('US'),
        description: 'Pleura b-lines annotation mode when the study involves US modality series',
      };
    },
    routes: [
      {
        path: 'longitudinal',
        /*init: ({ servicesManager, extensionManager }) => {
          //defaultViewerRouteInit
        },*/
        layoutTemplate: () => {
          return {
            id: ohif.layout,
            props: {
              leftPanels: [tracked.thumbnailList],
              leftPanelResizable: true,
              rightPanels: [usAnnotation.panel, cornerstone.segmentation, tracked.measurements],
              rightPanelResizable: true,
              viewports: [
                {
                  namespace: tracked.viewport,
                  displaySetsToDisplay: [
                    ohif.sopClassHandler,
                    dicomvideo.sopClassHandler,
                    dicomsr.sopClassHandler3D,
                    ohif.wsiSopClassHandler,
                  ],
                },
                {
                  namespace: dicomsr.viewport,
                  displaySetsToDisplay: [dicomsr.sopClassHandler],
                },
                {
                  namespace: dicompdf.viewport,
                  displaySetsToDisplay: [dicompdf.sopClassHandler],
                },
                {
                  namespace: dicomSeg.viewport,
                  displaySetsToDisplay: [dicomSeg.sopClassHandler],
                },
                {
                  namespace: dicomPmap.viewport,
                  displaySetsToDisplay: [dicomPmap.sopClassHandler],
                },
                {
                  namespace: dicomRT.viewport,
                  displaySetsToDisplay: [dicomRT.sopClassHandler],
                },
              ],
            },
          };
        },
      },
    ],
    extensions: extensionDependencies,
    // Default protocol gets self-registered by default in the init
    hangingProtocol: 'default',
    // Order is important in sop class handlers when two handlers both use
    // the same sop class under different situations.  In that case, the more
    // general handler needs to come last.  For this case, the dicomvideo must
    // come first to remove video transfer syntax before ohif uses images
    sopClassHandlers: [
      dicomvideo.sopClassHandler,
      dicomSeg.sopClassHandler,
      dicomPmap.sopClassHandler,
      ohif.sopClassHandler,
      ohif.wsiSopClassHandler,
      dicompdf.sopClassHandler,
      dicomsr.sopClassHandler3D,
      dicomsr.sopClassHandler,
      dicomRT.sopClassHandler,
    ],
    ...modeConfiguration,
  };
}

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;
export { initToolGroups, toolbarButtons };
