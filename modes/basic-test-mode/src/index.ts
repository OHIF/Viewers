import i18n from 'i18next';
import { ToolbarService } from '@ohif/core';
import {
  isValidMode,
  layoutTemplate,
  modeFactory,
  modeInstance as basicModeInstance,
} from '@ohif/mode-basic';

import toolbarButtons from './toolbarButtons';
import { id } from './id';
import initToolGroups from './initToolGroups';

const { TOOLBAR_SECTIONS } = ToolbarService;

// Allow this mode by excluding non-imaging modalities such as SR, SEG
// Also, SM is not a simple imaging modalities, so exclude it.
const NON_IMAGE_MODALITIES = ['ECG', 'SR', 'SEG', 'RTSTRUCT'];

const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  wsiSopClassHandler:
    '@ohif/extension-cornerstone.sopClassHandlerModule.DicomMicroscopySopClassHandler',
  thumbnailList: '@ohif/extension-default.panelModule.seriesList',
};

const testExtension = {
  measurements: '@ohif/extension-test.panelModule.panelMeasurementSeries',
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
};

const dicompdf = {
  sopClassHandler: '@ohif/extension-dicom-pdf.sopClassHandlerModule.dicom-pdf',
  viewport: '@ohif/extension-dicom-pdf.viewportModule.dicom-pdf',
};

const dicomSeg = {
  sopClassHandler: '@ohif/extension-cornerstone-dicom-seg.sopClassHandlerModule.dicom-seg',
  viewport: '@ohif/extension-cornerstone-dicom-seg.viewportModule.dicom-seg',
};

const cornerstone = {
  panel: '@ohif/extension-cornerstone.panelModule.panelSegmentation',
  measurements: '@ohif/extension-cornerstone.panelModule.panelMeasurement',
};

const dicomPmap = {
  sopClassHandler: '@ohif/extension-cornerstone-dicom-pmap.sopClassHandlerModule.dicom-pmap',
  viewport: '@ohif/extension-cornerstone-dicom-pmap.viewportModule.dicom-pmap',
};

const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-measurement-tracking': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-sr': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-seg': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-pmap': '^3.0.0',
  '@ohif/extension-dicom-pdf': '^3.0.1',
  '@ohif/extension-dicom-video': '^3.0.1',
  '@ohif/extension-test': '^0.0.1',
};

/**
 * The test mode's toolbar layout, supplied as literal values rather than
 * `{ $reference }` capability-pack markers (the composition is resolved the
 * same way either — literals pass through untouched).
 */
const toolbarSections = {
  [TOOLBAR_SECTIONS.primary]: [
    'MeasurementTools',
    'Zoom',
    'WindowLevelGroup',
    'Pan',
    'Capture',
    'Layout',
    'MPR',
    'Crosshairs',
    'MoreTools',
  ],

  WindowLevelGroup: ['WindowLevel', 'Soft tissue', 'Lung', 'Liver', 'Bone', 'Brain'],

  [TOOLBAR_SECTIONS.viewportActionMenu.topLeft]: ['orientationMenu', 'dataOverlayMenu'],

  [TOOLBAR_SECTIONS.viewportActionMenu.bottomMiddle]: ['AdvancedRenderingControls'],

  AdvancedRenderingControls: ['voiManualControlMenu', 'Colorbar', 'opacityMenu', 'thresholdMenu'],

  [TOOLBAR_SECTIONS.viewportActionMenu.topRight]: [
    'modalityLoadBadge',
    'trackingStatus',
    'navigationComponent',
  ],

  [TOOLBAR_SECTIONS.viewportActionMenu.bottomLeft]: ['windowLevelMenu'],

  MeasurementTools: [
    'Length',
    'Bidirectional',
    'ArrowAnnotate',
    'EllipticalROI',
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
    'RectangleROI',
    'CalibrationLine',
    'TagBrowser',
    'AdvancedMagnify',
    'UltrasoundDirectionalTool',
    'WindowLevelRegion',
  ],
};

export const basicTestLayout = {
  id: ohif.layout,
  props: {
    // Literal panel lists; the shared layout template also accepts
    // customization names here.
    leftPanels: [tracked.thumbnailList],
    leftPanelResizable: true,
    rightPanels: [cornerstone.panel, tracked.measurements, testExtension.measurements],
    rightPanelResizable: true,
    viewports: [
      {
        namespace: tracked.viewport,
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
    ],
  },
};

export const basicTestRoute = {
  path: 'basic-test',
  layoutTemplate,
  layoutInstance: basicTestLayout,
};

/**
 * Extends the basic mode instance: the shared onModeEnter/onModeExit are
 * inherited, and the test specifics (toolbar layout, tool groups, test
 * customizations) are supplied as instance data.
 */
export const modeInstance = {
  ...basicModeInstance,
  id,
  routeName: 'basic-test',
  displayName: i18n.t('Modes:Basic Test Mode'),
  // Literal toolbar values instead of the basic mode's customization names.
  toolbarButtons,
  toolbarSections,
  // Tool group setup used by the shared onModeEnter.
  initToolGroups,
  // The mode's own customizations, applied by the mode route as the bottom
  // layer of the mode scope: the test extension's custom context menu, plus
  // the undo hotkey used by the E2E tests.  Given as a literal here; modes may
  // also reference a registered block by name (see `basicModeCustomizations`).
  modeCustomizations: [
    '@ohif/extension-test.customizationModule.custom-context-menu',
    {
      'ohif.hotkeyBindings': {
        $push: [
          {
            commandName: 'undo',
            label: 'Undo',
            keys: ['ctrl+z'],
            isEditable: true,
          },
        ],
      },
    },
  ],

  isValidMode,
  nonModeModalities: NON_IMAGE_MODALITIES,
  routes: [basicTestRoute],
  extensions: extensionDependencies,
  hangingProtocol: 'default',
  sopClassHandlers: [
    dicomvideo.sopClassHandler,
    dicomSeg.sopClassHandler,
    ohif.wsiSopClassHandler,
    ohif.sopClassHandler,
    dicompdf.sopClassHandler,
    dicomsr.sopClassHandler,
    dicomsr.sopClassHandler3D,
  ],
  hotkeys: {
    name: 'basic-test-hotkeys',
  },
};

const mode = {
  id,
  modeFactory,
  modeInstance,
  extensionDependencies,
};

export default mode;
export { initToolGroups };
