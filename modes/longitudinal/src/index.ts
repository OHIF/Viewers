import i18n from 'i18next';
import { id } from './id';
import { initToolGroups, toolbarButtons, cornerstone,
  ohif,
  dicomsr,
  dicomvideo,
  basicLayout,
  extensionDependencies as basicDependencies,
  modeInstance as basicModeInstance,
  layoutTemplate as basicLayoutTemplate,
} from '@ohif/mode-basic';

export const tracked = {
  measurements: '@ohif/extension-measurement-tracking.panelModule.trackedMeasurements',
  thumbnailList: '@ohif/extension-measurement-tracking.panelModule.seriesList',
  viewport: '@ohif/extension-measurement-tracking.viewportModule.cornerstone-tracked',
};

export const extensionDependencies = {
  ...basicDependencies,
  '@ohif/extension-measurement-tracking': '^3.0.0',
  '@semenoflabs/extension-side-chat': '^1.0.0',
};

export const sideChat = {
  chat: '@semenoflabs/extension-side-chat.panelModule.sideChat',
};

export const defaultExtension = {
  medBook: '@ohif/extension-default.panelModule.panelMedBook',
};

// Define the right panels array with segmentation, medbook, and chat
const rightPanelsArray = [cornerstone.segmentation, defaultExtension.medBook, sideChat.chat];
console.log('[Longitudinal] Setting up rightPanels:', rightPanelsArray);

export const longitudinalLayout = {
  ...basicLayout,
  id: ohif.layout,
  props: {
    ...basicLayout.props,
    leftPanels: [tracked.thumbnailList],
    rightPanels: rightPanelsArray,
    rightPanelClosed: false,
    viewports: [
      {
        namespace: tracked.viewport,
        displaySetsToDisplay: basicLayout.props.viewports[0].displaySetsToDisplay,
      },
      ...basicLayout.props.viewports,
    ],
  },
};

// Create our own layout template function - use direct reference instead of 'this'
function longitudinalLayoutTemplate() {
  console.log('[Longitudinal] layoutTemplate called');
  console.log('[Longitudinal] longitudinalLayout.props.rightPanels:', longitudinalLayout?.props?.rightPanels);
  // Deep clone the layout instance
  const cloned = JSON.parse(JSON.stringify(longitudinalLayout));
  console.log('[Longitudinal] Returning cloned rightPanels:', cloned?.props?.rightPanels);
  return cloned;
}

export const longitudinalRoute = {
  path: 'viewer',
  layoutTemplate: longitudinalLayoutTemplate,
  layoutInstance: longitudinalLayout,
};

export const modeInstance = {
  ...basicModeInstance,
  id,
  routeName: 'viewer',
  displayName: i18n.t('Modes:Basic Viewer'),
  routes: [longitudinalRoute],
  extensions: extensionDependencies,
};

// Override modeFactory to ensure our modeInstance is used
function modeFactory({ modeConfiguration }) {
  console.log('[Longitudinal] modeFactory called');
  return modeInstance;
}

const mode = {
  id,
  modeFactory,
  modeInstance,
  extensionDependencies,
};

export default mode;
export { initToolGroups, toolbarButtons };
