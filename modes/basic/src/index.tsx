import update from 'immutability-helper';
import { utils } from '@ohif/core';

import initToolGroups from './initToolGroups';
import {
  addActivatePanelTriggers,
  applyToolGroupAdditions,
  registerModeToolbar,
} from './modeCustomization';
import { id } from './id';

const { structuredCloneWithFunctions } = utils;

/**
 * Define non-imaging modalities.
 * This can be used to exclude modes which have only these modalities,
 * or it can be used to not display thumbnails for some of these.
 * This list used to include SM, for whole slide imaging, but this is now supported
 * by cornerstone.  Others of these may get added.
 */
export const NON_IMAGE_MODALITIES = ['SEG', 'RTSTRUCT', 'RTPLAN', 'PR', 'SR'];

export const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  thumbnailList: '@ohif/extension-default.panelModule.seriesList',
  hangingProtocol: '@ohif/extension-default.hangingProtocolModule.default',
  wsiSopClassHandler:
    '@ohif/extension-cornerstone.sopClassHandlerModule.DicomMicroscopySopClassHandler',
};

export const cornerstone = {
  measurements: '@ohif/extension-cornerstone.panelModule.panelMeasurement',
  labelMapSegmentationPanel:
    '@ohif/extension-cornerstone.panelModule.panelSegmentationWithToolsLabelMap',
  contourSegmentationPanel:
    '@ohif/extension-cornerstone.panelModule.panelSegmentationWithToolsContour',
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
};

export const dicomecg = {
  sopClassHandler: '@ohif/extension-cornerstone.sopClassHandlerModule.DicomEcgSopClassHandler',
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

export const segmentation = {
  sopClassHandler: '@ohif/extension-cornerstone-dicom-seg.sopClassHandlerModule.dicom-seg',
  viewport: '@ohif/extension-cornerstone-dicom-seg.viewportModule.dicom-seg',
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
  dicomecg.sopClassHandler,
  dicomSeg.sopClassHandler,
  dicomPmap.sopClassHandler,
  ohif.sopClassHandler,
  ohif.wsiSopClassHandler,
  dicompdf.sopClassHandler,
  dicomsr.sopClassHandler3D,
  dicomsr.sopClassHandler,
  dicomRT.sopClassHandler,
];

/**
 * Data-driven mode validity check, using these mode instance properties:
 *   - `excludedStudies`: a list of `{ attribute: value }` objects; a study
 *     matching every attribute of any entry is invalid.
 *   - `excludedModalities`: the study is invalid when it contains ANY of these.
 *   - `modeModalities`: the study is valid when it contains at least one entry;
 *     an array entry requires all of its modalities to be present (e.g.
 *     `[['PT', 'CT']]` requires both PT and CT).
 *   - otherwise `nonModeModalities`: the study is valid when it contains at
 *     least one modality NOT in this list.
 */
export function isValidMode({ modalities, study }) {
  const modalities_list = modalities.split('\\');

  if (study && this.excludedStudies?.length) {
    const excluded = this.excludedStudies.find(exclusion =>
      Object.entries(exclusion).every(([key, value]) => study[key] === value)
    );
    if (excluded) {
      return {
        valid: false,
        description: `The mode excludes studies matching: ${JSON.stringify(excluded)}`,
      };
    }
  }

  if (this.excludedModalities?.length) {
    const excluded = this.excludedModalities.find(modality => modalities_list.includes(modality));
    if (excluded) {
      return {
        valid: false,
        description: `The mode does not support studies containing the ${excluded} modality`,
      };
    }
  }

  if (this.modeModalities?.length) {
    for (const modeModality of this.modeModalities) {
      if (Array.isArray(modeModality)) {
        if (modeModality.every(m => modalities_list.includes(m))) {
          return { valid: true, description: `Matches ${modeModality.join(', ')}` };
        }
      } else if (modalities_list.includes(modeModality)) {
        return { valid: true, description: `Matches ${modeModality}` };
      }
    }
    return {
      valid: false,
      description: `None of the mode modalities match: ${JSON.stringify(this.modeModalities)}`,
    };
  }

  const nonModeModalities = this.nonModeModalities ?? [];
  return {
    valid: !!modalities_list.find(modality => !nonModeModalities.includes(modality)),
    description: `The mode does not support studies that ONLY include the following modalities: ${nonModeModalities.join(', ')}`,
  };
}

/**
 * The panel activation triggers the basic family of modes historically shipped
 * (commented out): activate the segmentation/measurement panel when a
 * segmentation/measurement is added.  Not enabled by default; a mode or
 * customization can set them via the `activatePanelTriggers` instance
 * property.
 */
export const defaultActivatePanelTriggers = [
  {
    panelId: cornerstone.segmentation,
    sourceServiceName: 'segmentationService',
    sourceEvents: ['SEGMENTATION_ADDED'],
  },
  {
    panelId: cornerstone.measurements,
    sourceServiceName: 'measurementService',
    sourceEvents: ['MEASUREMENT_ADDED', 'RAW_MEASUREMENT_ADDED'],
  },
];

export function onModeEnter({ servicesManager, extensionManager, commandsManager }: withAppTypes) {
  const { measurementService, toolbarService, toolGroupService, customizationService } =
    servicesManager.services;

  measurementService.clearMeasurements();

  // Subscriptions the mode creates are tracked as unsubscribe functions on the
  // instance; the shared onModeExit cleans them up.  Extending modes push
  // their own unsubscribe functions here after calling this function.
  this._unsubscriptions = [];

  // Init the mode's tool groups.  The function is a mode instance property so
  // extending modes can substitute their own tool group setup.
  this.initToolGroups?.({ extensionManager, toolGroupService, commandsManager, servicesManager });

  // Toolbar buttons and layout come from the mode's composition, which the
  // mode route seeded onto the Mode customization scope on enter (the plain
  // `toolbarButtons` / `toolbarSections` keys) and the app config / URL `mode`
  // phase then layered on top. Reading them here — after that layering — lets
  // `?customization=` modules extend the toolbar without the mode restating it.
  registerModeToolbar(
    { toolbarService },
    {
      toolbarButtons: customizationService.getCustomization('toolbarButtons'),
      toolbarSections: customizationService.getCustomization('toolbarSections'),
    }
  );

  // Extra tools (e.g. segmentation editing tools added by a customization) are
  // layered onto the tool groups created above, from the resolved
  // `toolGroupAdditions` composition (seeded on enter, refined by the `mode`
  // phase).
  applyToolGroupAdditions(
    { toolGroupService },
    customizationService.getCustomization('toolGroupAdditions')
  );

  // Note: the mode's `modeCustomizations` are NOT applied here — the mode
  // route applies them right after the mode scope is reset, before the app
  // config / URL `mode` phase blocks, so the final value of every key is
  // decided purely by customization scope precedence and application order.

  // ActivatePanel event triggers (e.g. activating the segmentation panel when
  // a segmentation is added).  Off by default; supplied as data so extending
  // modes and customizations can point at their own panels.
  this._unsubscriptions.push(
    ...addActivatePanelTriggers({ servicesManager }, this.activatePanelTriggers)
  );
}

export function onModeExit({ servicesManager }: withAppTypes) {
  const {
    toolGroupService,
    syncGroupService,
    segmentationService,
    cornerstoneViewportService,
    uiDialogService,
    uiModalService,
  } = servicesManager.services;

  this._unsubscriptions?.forEach(unsubscribe => unsubscribe());
  this._unsubscriptions = [];

  uiDialogService.hideAll();
  uiModalService.hide();
  toolGroupService.destroy();
  syncGroupService.destroy();
  segmentationService.destroy();
  cornerstoneViewportService.destroy();
}

export const basicLayout = {
  id: ohif.layout,
  props: {
    // Literal panel lists. The mode route seeds these into the standard
    // `leftPanels` / `rightPanels` customizations at the bottom of
    // the mode scope, so `mode` phase blocks and global customizations can
    // modify them (e.g. swap in the segmentation panels with editing tools)
    // before the sidebars resolve.
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
          dicomecg.sopClassHandler,
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
  return structuredCloneWithFunctions(this.layoutInstance);
}

export const basicRoute = {
  path: 'basic',
  layoutTemplate,
  layoutInstance: basicLayout,
};

export const modeInstance = {
  // TODO: We're using this as a route segment
  // We should not be.
  id,
  routeName: 'basic',
  // Don't hide this by default - see the registration later to hide the basic
  // instance by default.
  hide: false,
  displayName: 'Non-Longitudinal Basic',
  // Toolbar/tool-group composition: which capability packs this mode uses,
  // named with `{ $reference }` markers the customization service expands at
  // read time. The mode route seeds these onto the Mode customization scope on
  // enter (as the plain `toolbarButtons` / `toolbarSections` /
  // `toolGroupAdditions` keys), so `?customization=` modules extend them
  // through the `mode` phase (e.g.
  // `mode.basic.toolbarButtons: { $push: [{ $reference: '...' }] }`).
  toolbarSections: [{ $reference: 'cornerstone.toolbarSections' }],
  toolGroupAdditions: {
    default: [],
    mpr: [],
    SRToolGroup: [],
    volume3d: [],
  },
  // Tool group setup used by onModeEnter; extending modes can replace it.
  initToolGroups,
  // The mode's own customizations, referenced by name: the block is registered
  // at default scope when the mode loads (see `customizations` below), and the
  // mode route applies it as the bottom layer of the mode scope on enter.
  // Later layers — the app config / URL `mode` phase blocks and any global
  // customization (e.g. `segmentationEditing`) — override it purely by
  // application order and scope precedence.
  modeCustomizations: 'basic.modeCustomizations',
  // ActivatePanel event triggers, applied on mode enter.  Empty by default so
  // the state the user left the UI in is respected; extending modes or
  // customizations can push `defaultActivatePanelTriggers` entries.
  activatePanelTriggers: [],

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
  routes: [basicRoute],
  extensions: extensionDependencies,
  // Default protocol gets self-registered by default in the init
  hangingProtocol: 'default',
  // Order is important in sop class handlers when two handlers both use
  // the same sop class under different situations.  In that case, the more
  // general handler needs to come last.  For this case, the dicomvideo must
  // come first to remove video transfer syntax before ohif uses images
  sopClassHandlers,
  toolbarButtons: [{ $reference: 'cornerstone.toolbarButtons' }],
  nonModeModalities: NON_IMAGE_MODALITIES,
};

/**
 * Creates a mode on this object, using immutability-helper to apply changes
 * from modeConfiguration into the modeInstance.
 */
export function modeFactory({ modeConfiguration }) {
  let modeInstance = this.modeInstance;
  if (modeConfiguration) {
    modeInstance = update(modeInstance, modeConfiguration);
  }
  return modeInstance;
}

/**
 * Customizations the mode registers with the customization service (Default
 * scope) when it loads — before the bootstrap phase applies, so bootstrap and
 * `?customization=` modules can modify them before anything reads them.
 * Values are plain data (registered customization values never carry `$`
 * commands — commands are how later customizations modify them).
 */
export const customizations = {
  // The mode's own mode-scope block, applied by the mode route as the bottom
  // layer of the mode scope on mode enter (see `modeCustomizations` above).
  'basic.modeCustomizations': {
    // Segmentation panel editing is off in the basic modes; e.g. the
    // `segmentationEditing` customization overrides this at global scope.
    'panelSegmentation.disableEditing': true,
  },
};

export const mode = {
  id,
  modeFactory,
  modeInstance: { ...modeInstance, hide: true },
  extensionDependencies,
  customizations,
};

export default mode;
export { initToolGroups };
export {
  addActivatePanelTriggers,
  applyToolGroupAdditions,
  registerModeToolbar,
} from './modeCustomization';
