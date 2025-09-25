import initToolGroups from './initToolGroups';
import toolbarButtons from './toolbarButtons';
import { id } from './id';
import { ToolbarService } from '@ohif/core';

const { TOOLBAR_SECTIONS } = ToolbarService;

// Allow this mode by excluding non-imaging modalities such as SR, SEG
// Also, SM is not a simple imaging modalities, so exclude it.
export const NON_IMAGE_MODALITIES = ['ECG', 'SEG', 'RTSTRUCT', 'RTPLAN', 'PR'];

export const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  thumbnailList: '@ohif/extension-default.panelModule.seriesList',
  wsiSopClassHandler:
    '@ohif/extension-cornerstone.sopClassHandlerModule.DicomMicroscopySopClassHandler',
};

export const cornerstone = {
  measurements: '@ohif/extension-cornerstone.panelModule.panelMeasurement',
  segmentation: '@ohif/extension-cornerstone.panelModule.panelSegmentation',
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
};

export const dicomsr = {
  sopClassHandler: '@ohif/extension-cornerstone-dicom-sr.sopClassHandlerModule.dicom-sr',
  sopClassHandler3D: '@ohif/extension-cornerstone-dicom-sr.sopClassHandlerModule.dicom-sr-3d',
  viewport: '@ohif/extension-cornerstone-dicom-sr.viewportModule.dicom-sr',
};

export const dicomvideo = {
  sopClassHandler: '@ohif/extension-dicom-video.sopClassHandlerModule.dicom-video',
  viewport: '@ohif/extension-dicom-video.viewportModule.dicom-video',
};

export const dicompdf = {
  sopClassHandler: '@ohif/extension-dicom-pdf.sopClassHandlerModule.dicom-pdf',
  viewport: '@ohif/extension-dicom-pdf.viewportModule.dicom-pdf',
};

export const dicomSeg = {
  sopClassHandler: '@ohif/extension-cornerstone-dicom-seg.sopClassHandlerModule.dicom-seg',
  viewport: '@ohif/extension-cornerstone-dicom-seg.viewportModule.dicom-seg',
};

export const dicomPmap = {
  sopClassHandler: '@ohif/extension-cornerstone-dicom-pmap.sopClassHandlerModule.dicom-pmap',
  viewport: '@ohif/extension-cornerstone-dicom-pmap.viewportModule.dicom-pmap',
};

export const dicomRT = {
  viewport: '@ohif/extension-cornerstone-dicom-rt.viewportModule.dicom-rt',
  sopClassHandler: '@ohif/extension-cornerstone-dicom-rt.sopClassHandlerModule.dicom-rt',
};

export const extensionDependencies = {
  // Can derive the versions at least process.env.from npm_package_version
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-sr': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-seg': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-pmap': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-rt': '^3.0.0',
  '@ohif/extension-dicom-pdf': '^3.0.1',
  '@ohif/extension-dicom-video': '^3.0.1',
};

export const sopClassHandlers = [
      dicomvideo.sopClassHandler,
      dicomSeg.sopClassHandler,
      dicomPmap.sopClassHandler,
      ohif.sopClassHandler,
      ohif.wsiSopClassHandler,
      dicompdf.sopClassHandler,
      dicomsr.sopClassHandler3D,
      dicomsr.sopClassHandler,
      dicomRT.sopClassHandler,
    ];

export function isValidMode({ modalities }) {
      const modalities_list = modalities.split('\\');

      // Exclude non-image modalities
      return {
        valid: !!modalities_list.filter(modality => this.nonModeModalities.indexOf(modality) === -1)
          .length,
        description:
          'The mode does not support studies that ONLY include the following modalities: SM, ECG, SEG, RTSTRUCT',
      };
    }

export function onModeEnter({ servicesManager, extensionManager, commandsManager, panelService, segmentationService }: withAppTypes) {
      const { measurementService, toolbarService, toolGroupService, customizationService } =
        servicesManager.services;

      measurementService.clearMeasurements();

      // Init Default and SR ToolGroups
      initToolGroups(extensionManager, toolGroupService, commandsManager);

      toolbarService.register(this.toolbarButtons);

      for(const [key,section] of Object.entries(this.toolbarSections)) {
        toolbarService.updateSection(key,section);
      }

      if( !this.enableSegmentationEdit ) {
        customizationService.setCustomizations({
          'panelSegmentation.disableEditing': {
            $set: true,
          },
        });
      }

      // // ActivatePanel event trigger for when a segmentation or measurement is added.
      // // Do not force activation so as to respect the state the user may have left the UI in.
      if( this.activatePanelTrigger ) {
        this._activatePanelTriggersSubscriptions = [
        ...panelService.addActivatePanelTriggers(
          cornerstone.segmentation,
          [
            {
              sourcePubSubService: segmentationService,
              sourceEvents: [segmentationService.EVENTS.SEGMENTATION_ADDED],
            },
          ],
          true
        ),
        ...panelService.addActivatePanelTriggers(
          cornerstone.measurements,
          [
            {
              sourcePubSubService: measurementService,
              sourceEvents: [
                measurementService.EVENTS.MEASUREMENT_ADDED,
                measurementService.EVENTS.RAW_MEASUREMENT_ADDED,
              ],
            },
          ],
          true
        ),
        true,
      ];
      }
    };

export function onModeExit({ servicesManager }: withAppTypes)  {
      const {
        toolGroupService,
        syncGroupService,
        segmentationService,
        cornerstoneViewportService,
        uiDialogService,
        uiModalService,
      } = servicesManager.services;

      this._activatePanelTriggersSubscriptions.forEach(sub => sub.unsubscribe());
      this._activatePanelTriggersSubscriptions = [];

      uiDialogService.hideAll();
      uiModalService.hide();
      toolGroupService.destroy();
      syncGroupService.destroy();
      segmentationService.destroy();
      cornerstoneViewportService.destroy();
    };

export const toolbarSections = {

        [TOOLBAR_SECTIONS.primary]: [
        'MeasurementTools',
        'Zoom',
        'Pan',
        'TrackballRotate',
        'WindowLevel',
        'Capture',
        'Layout',
        'Crosshairs',
        'MoreTools',
      ],

      [TOOLBAR_SECTIONS.viewportActionMenu.topLeft]: [
        'orientationMenu',
        'dataOverlayMenu',
      ],

      [TOOLBAR_SECTIONS.viewportActionMenu.bottomMiddle]: [
        'AdvancedRenderingControls',
      ],

      AdvancedRenderingControls: [
        'windowLevelMenuEmbedded',
        'voiManualControlMenu',
        'Colorbar',
        'opacityMenu',
        'thresholdMenu',
      ],

      [TOOLBAR_SECTIONS.viewportActionMenu.topRight]: [
        'modalityLoadBadge',
        'trackingStatus',
        'navigationComponent',
      ],

      [TOOLBAR_SECTIONS.viewportActionMenu.bottomLeft]: [
        'windowLevelMenu',
      ],

      MeasurementTools: [
        'Length',
        'Bidirectional',
        'ArrowAnnotate',
        'EllipticalROI',
        'RectangleROI',
        'CircleROI',
        'PlanarFreehandROI',
        'SplineROI',
        'LivewireContour',
      ],

      MoreTools: [
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
        'WindowLevelRegion',
        'SegmentLabelTool',
      ],
    };

export const basicLayout =
       {
            id: ohif.layout,
            props: {
              leftPanels: [ohif.thumbnailList],
              leftPanelResizable: true,
              rightPanels: [cornerstone.segmentation, cornerstone.measurements],
              rightPanelClosed: true,
              rightPanelResizable: true,
              viewports: [
                {
                  namespace: cornerstone.viewport,
                  displaySetsToDisplay: [
                    ohif.sopClassHandler,
                    dicomvideo.sopClassHandler,
                    ohif.wsiSopClassHandler,
                  ],
                },
                {
                  namespace: dicomsr.viewport,
                  displaySetsToDisplay: [dicomsr.sopClassHandler, dicomsr.sopClassHandler3D],
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

export function layoutTemplate() {
  return this.layoutInstance;
}

export const basicRoute = {
  path: 'basic',
  layoutTemplate,
  layoutInstance: basicLayout,
}

export const modeInstance = {
    // TODO: We're using this as a route segment
    // We should not be.
    id,
    routeName: 'basic',
    // Don't hide this by default - see the registration later to hide the basic
    // instance by default.
    hide: false,
    displayName: 'Non-Longitudinal Basic',
    _activatePanelTriggersSubscriptions: [],
    toolbarSections,

    /**
     * Lifecycle hooks
     */
    onModeEnter,
    onModeExit,
    validationTags: {
      study: [],
      series: [],
    },

    isValidMode,
    routes: [ basicRoute ],
    extensions: extensionDependencies,
    // Default protocol gets self-registered by default in the init
    hangingProtocol: 'default',
    // Order is important in sop class handlers when two handlers both use
    // the same sop class under different situations.  In that case, the more
    // general handler needs to come last.  For this case, the dicomvideo must
    // come first to remove video transfer syntax before ohif uses images
    sopClassHandlers,
    toolbarButtons,
    enableSegmentationEdit: false,
    nonModeModalities: NON_IMAGE_MODALITIES,
  };

export function modeFactory({ modeConfiguration }) {
  return { ...this.modeInstance, ...modeConfiguration };
}


export const mode = {
  id,
  modeFactory,
  modeInstance: { ...modeInstance, hide: true },
  extensionDependencies,
};

export default mode;
export { initToolGroups, toolbarButtons };
