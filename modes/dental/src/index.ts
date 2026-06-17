import i18n from 'i18next';
import {
  basicLayout,
  basicRoute,
  cornerstone,
  dicomecg,
  dicompdf,
  dicomPmap,
  dicomRT,
  dicomSeg,
  dicomsr,
  dicomvideo,
  extensionDependencies as basicDependencies,
  initToolGroups,
  mode as basicMode,
  modeInstance as basicModeInstance,
  ohif,
  sopClassHandlers,
  toolbarButtons,
  toolbarSections,
} from '@ohif/mode-basic';

import { id } from './id';

const dental = {
  layout: '@ohif/extension-dental.layoutTemplateModule.dentalViewerLayout',
  hangingProtocol: '@ohif/extension-dental.hangingProtocolModule.dental2x2',
};

export const extensionDependencies = {
  ...basicDependencies,
  '@ohif/extension-dental': '^3.0.0',
};

export const dentalLayout = {
  ...basicLayout,
  id: dental.layout,
  props: {
    ...basicLayout.props,
    rightPanelClosed: true,
  },
};

export const dentalRoute = {
  ...basicRoute,
  path: 'dental',
  layoutInstance: dentalLayout,
};

export const modeInstance = {
  ...basicModeInstance,
  id,
  routeName: 'dental',
  hide: true,
  displayName: i18n.t('Modes:Dental Viewer'),
  routes: [dentalRoute],
  extensions: extensionDependencies,
  hangingProtocol: dental.hangingProtocol,
  toolbarSections,
  sopClassHandlers,
  toolbarButtons,
};

const mode = {
  ...basicMode,
  id,
  modeInstance,
  extensionDependencies,
};

export default mode;
export {
  cornerstone,
  dicomecg,
  dicompdf,
  dicomPmap,
  dicomRT,
  dicomSeg,
  dicomsr,
  dicomvideo,
  initToolGroups,
  ohif,
  toolbarButtons,
};
