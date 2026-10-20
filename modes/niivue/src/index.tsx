import { id } from './id';
import {
  ohif,
  cornerstone,
  dicompdf,
  dicomvideo,
  extensionDependencies as basicExtensionDependencies,
  isValidMode,
  onModeEnter,
  onModeExit,
  layoutTemplate,
  modeFactory,
  initToolGroups,
  NON_IMAGE_MODALITIES,
} from '@ohif/mode-basic';

export const niivue = {
  viewport: '@niivue/nv-ohif.viewportModule.niivue',
  // NiiVue's own whole-slide handler. Using it instead of OHIF's
  // DicomMicroscopySopClassHandler avoids the microscopy viewport's
  // `viewportType: WHOLE_SLIDE` override, so SM series land in the NiiVue
  // viewport and render via NVSlide.
  wsiSopClassHandler: '@niivue/nv-ohif.sopClassHandlerModule.niivue-wsi',
};

export const extensionDependencies = {
  ...basicExtensionDependencies,
  '@niivue/nv-ohif': '^1.0.0-rc.14',
};

export const niivueLayout = {
  id: ohif.layout,
  props: {
    // Literal panel lists; the mode route seeds them into the standard
    // `leftPanels` / `rightPanels` customizations so `mode` phase
    // blocks and global customizations can modify them.
    leftPanels: [ohif.thumbnailList],
    leftPanelResizable: true,
    // NiiVue annotations are reflected into OHIF's Measurements panel.
    rightPanels: [cornerstone.measurements],
    rightPanelClosed: true,
    rightPanelResizable: true,
    // Every image and whole-slide series renders in NiiVue. PDF keeps OHIF's
    // PDF viewport; video plays in the Cornerstone video viewport, since
    // NiiVue has no video reader.
    viewports: [
      {
        namespace: niivue.viewport,
        displaySetsToDisplay: [ohif.sopClassHandler, niivue.wsiSopClassHandler],
      },
      {
        namespace: dicompdf.viewport,
        displaySetsToDisplay: [dicompdf.sopClassHandler],
      },
      {
        namespace: cornerstone.viewport,
        displaySetsToDisplay: [dicomvideo.sopClassHandler],
      },
    ],
  },
};

export const niivueRoute = {
  path: 'template',
  layoutTemplate,
  layoutInstance: niivueLayout,
};

export const modeInstance = {
  id,
  routeName: 'niivue',
  displayName: 'NiiVue Viewer',
  // Toolbar/tool-group composition. The cornerstone packs are still needed:
  // the NiiVue viewport mirrors the active tool of the `default` tool group,
  // and OHIF's Measurement tools are backed by NiiVue annotations.
  toolbarButtons: [
    { $reference: 'cornerstone.toolbarButtons' },
    { $reference: 'niivue.toolbarButtons' },
    {
      // Grid-only layout selector. The stock `Layout` button also offers the
      // MPR / 3D hanging protocols, which build Cornerstone volume viewports;
      // NiiVue's own views (NiivueViews) cover those. A distinct id is needed
      // because ToolbarService registration is first-registration-wins.
      id: 'NiivueLayout',
      uiType: 'ohif.layoutSelector',
      props: {
        rows: 3,
        columns: 4,
        evaluate: 'evaluate.action',
      },
    },
  ],
  toolbarSections: [
    { $reference: 'cornerstone.toolbarSections' },
    { $reference: 'niivue.toolbarSections' },
    {
      // NiivueCapture / NiivueCrosshair replace cornerstone's Capture /
      // Crosshairs, which error or no-op on a NiiVue viewport.
      primary: [
        'MeasurementTools',
        'Zoom',
        'Pan',
        'WindowLevel',
        'NiivueViews',
        'NiivueClip',
        'NiivueWindowLevel',
        'NiivueColormap',
        'NiivueColorbar',
        'NiivueInterpolation',
        'NiivueRuler',
        'NiivueOverlay',
        'NiivueReset',
        'NiivueCapture',
        'NiivueLayout',
        'NiivueCrosshair',
      ],
    },
  ],
  toolGroupAdditions: {
    default: [],
    mpr: [],
    SRToolGroup: [],
    volume3d: [],
  },
  initToolGroups,
  modeCustomizations: 'niivueModeCustomizations',
  activatePanelTriggers: [],

  onModeEnter,
  onModeExit,
  validationTags: {
    study: [],
    series: [],
  },

  isValidMode,
  nonModeModalities: NON_IMAGE_MODALITIES,
  routes: [niivueRoute],
  extensions: extensionDependencies,
  hangingProtocol: 'default',
  // The video handler must come before the general stack handler so video
  // series play in the video viewport instead of being sent to dcm2niix.
  sopClassHandlers: [
    dicomvideo.sopClassHandler,
    dicompdf.sopClassHandler,
    niivue.wsiSopClassHandler,
    ohif.sopClassHandler,
  ],
};

/**
 * Customizations the mode registers (Default scope) when it loads; the mode
 * route applies `niivueModeCustomizations` as the bottom layer of the mode
 * scope on enter.
 */
export const customizations = {
  niivueModeCustomizations: {
    'panelSegmentation.disableEditing': true,
    // Hide the MPR / 3D hanging protocol presets in the layout selector; they
    // create Cornerstone volume viewports.
    'layoutSelector.advancedPresetGenerator': () => [],
  },
};

const mode = {
  id,
  modeFactory,
  modeInstance,
  extensionDependencies,
  customizations,
};

export default mode;
