import { id } from './id';
import initToolGroups from './initToolGroups';
import setUpAutoTabSwitchHandler from './utils/setUpAutoTabSwitchHandler';
import {
  ohif,
  cornerstone,
  extensionDependencies,
  dicomRT,
  segmentation,
  isValidMode,
  onModeEnter as basicOnModeEnter,
  onModeExit,
  layoutTemplate,
  modeFactory,
} from '@ohif/mode-basic';

/**
 * Extends the basic mode enter with the segmentation panel auto tab switch
 * handling (switching between labelmap/contour panels as segmentations of the
 * relevant type become active).
 */
export function onModeEnter(ctx: withAppTypes) {
  basicOnModeEnter.call(this, ctx);

  const { segmentationService, viewportGridService, panelService } = ctx.servicesManager.services;

  const { unsubscribeAutoTabSwitchEvents } = setUpAutoTabSwitchHandler({
    segmentationService,
    viewportGridService,
    panelService,
  });

  this._unsubscriptions.push(...unsubscribeAutoTabSwitchEvents);
}

export const segmentationLayout = {
  id: ohif.layout,
  props: {
    // Literal panel lists; the mode route seeds them into the standard
    // `mode.leftPanels` / `mode.rightPanels` customizations so `mode` phase
    // blocks and global customizations can modify them.
    leftPanels: [ohif.thumbnailList],
    leftPanelResizable: true,
    rightPanels: [cornerstone.labelMapSegmentationPanel, cornerstone.contourSegmentationPanel],
    rightPanelResizable: true,
    viewports: [
      {
        namespace: cornerstone.viewport,
        displaySetsToDisplay: [ohif.sopClassHandler],
      },
      {
        namespace: segmentation.viewport,
        displaySetsToDisplay: [segmentation.sopClassHandler],
      },
      {
        namespace: dicomRT.viewport,
        displaySetsToDisplay: [dicomRT.sopClassHandler],
      },
    ],
  },
};

export const segmentationRoute = {
  path: 'template',
  layoutTemplate,
  layoutInstance: segmentationLayout,
};

export const modeInstance = {
  id,
  routeName: 'segmentation',
  displayName: 'Segmentation',
  // Toolbar buttons/layout and tool group additions are referenced by
  // customization name; the cornerstone extension registers the defaults and
  // `?customization=` modules can extend them (e.g. add new segmentation
  // tools, remove defaults, or add the annotation tools).
  toolbarButtons: 'segmentation.toolbarButtons',
  toolbarSections: 'segmentation.toolbarSections',
  toolGroupAdditions: 'segmentation.toolGroupAdditions',
  // Tool group setup used by onModeEnter; extending modes can replace it.
  initToolGroups,
  // The mode's own customizations, applied by the mode route as the bottom
  // layer of the mode scope.  Unlike basic, the registered block is empty (no
  // `panelSegmentation.disableEditing`): the segmentation panel is editable.
  modeCustomizations: 'segmentation.modeCustomizations',
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

  // Data-driven validity: valid unless the study ONLY contains modalities that
  // segmentation cannot be performed on.
  isValidMode,
  nonModeModalities: ['SM', 'ECG', 'OT', 'DOC'],
  routes: [segmentationRoute],
  extensions: extensionDependencies,
  // Prefer the grid layout hanging protocol when applicable.
  hangingProtocol: ['@ohif/mnGrid'],
  sopClassHandlers: [ohif.sopClassHandler, segmentation.sopClassHandler, dicomRT.sopClassHandler],
};

/**
 * Customizations the mode registers (Default scope) when it loads.  The mode's
 * own block is empty — the segmentation panel is editable in this mode — but
 * it is registered so bootstrap / `?customization=` modules can add
 * mode-scoped values to it.
 */
export const customizations = {
  'segmentation.modeCustomizations': {},
};

/**
 * The mode uses the basic mode's `modeFactory`, which applies
 * immutability-helper commands from `modeConfiguration` onto `modeInstance`,
 * so a site can define a `mySegmentation` mode that extends this one.
 */
const mode = {
  id,
  modeFactory,
  modeInstance,
  extensionDependencies,
  customizations,
};

export default mode;
export { initToolGroups };
