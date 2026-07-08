import { id } from './id';
import initToolGroups from './initToolGroups';
import setUpAutoTabSwitchHandler from './utils/setUpAutoTabSwitchHandler';
import {
  ohif,
  cornerstone,
  extensionDependencies,
  dicomRT,
  segmentation,
  onModeEnter as basicOnModeEnter,
  onModeExit as basicOnModeExit,
  layoutTemplate,
  modeFactory,
} from '@ohif/mode-basic';

/**
 * Indicate this is a valid mode unless the studies ONLY contain modalities
 * that segmentation cannot be performed on.
 */
export function isValidMode({ modalities }) {
  const modalitiesArray = modalities.split('\\');
  return {
    valid:
      modalitiesArray.length === 1 ? !['SM', 'ECG', 'OT', 'DOC'].includes(modalitiesArray[0]) : true,
    description:
      'The mode does not support studies that ONLY include the following modalities: SM, OT, DOC',
  };
}

/**
 * Extends the basic mode enter with the segmentation panel auto tab switch
 * handling (switching between labelmap/contour panels as segmentations of the
 * relevant type become active).
 */
export function onModeEnter(ctx: withAppTypes) {
  basicOnModeEnter.call(this, ctx);

  const { segmentationService, viewportGridService, panelService } =
    ctx.servicesManager.services;

  const { unsubscribeAutoTabSwitchEvents } = setUpAutoTabSwitchHandler({
    segmentationService,
    viewportGridService,
    panelService,
  });

  this._unsubscriptions.push(...unsubscribeAutoTabSwitchEvents);
}

export function onModeExit(ctx: withAppTypes) {
  this._unsubscriptions.forEach(unsubscribe => unsubscribe());
  this._unsubscriptions.length = 0;

  basicOnModeExit.call(this, ctx);
}

export const segmentationLayout = {
  id: ohif.layout,
  props: {
    // Panel lists are customization names; the cornerstone extension registers
    // the defaults and `?customization=` modules can replace them.
    leftPanels: 'segmentation.leftPanels',
    leftPanelResizable: true,
    rightPanels: 'segmentation.rightPanels',
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
  _activatePanelTriggersSubscriptions: [],
  _unsubscriptions: [],
  // Toolbar buttons/layout and tool group additions are referenced by
  // customization name; the cornerstone extension registers the defaults and
  // `?customization=` modules can extend them (e.g. add new segmentation
  // tools, remove defaults, or add the annotation tools).
  toolbarButtons: 'segmentation.toolbarButtons',
  toolbarSections: 'segmentation.toolbarSections',
  toolGroupAdditions: 'segmentation.toolGroupAdditions',
  // Tool group setup used by onModeEnter; extending modes can replace it.
  initToolGroups,
  // The segmentation panel is editable in this mode.
  enableSegmentationEdit: true,

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
  routes: [segmentationRoute],
  extensions: extensionDependencies,
  // Prefer the grid layout hanging protocol when applicable.
  hangingProtocol: ['@ohif/mnGrid'],
  sopClassHandlers: [ohif.sopClassHandler, segmentation.sopClassHandler, dicomRT.sopClassHandler],
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
};

export default mode;
export { initToolGroups };
