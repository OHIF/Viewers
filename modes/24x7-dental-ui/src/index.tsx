import i18n from 'i18next';
import { id } from './id';
import {
  initToolGroups,
  toolbarButtons,
  cornerstone,
  ohif,
  basicLayout,
  basicRoute,
  extensionDependencies as basicDependencies,
  mode as basicMode,
  modeInstance as basicModeInstance,
} from '@ohif/mode-basic';
import dentalTranslations from './i18n/locales/en-US/Modes.json';

const namespaces = ['en-US', 'en-GB', 'en'];
namespaces.forEach(locale => {
  i18n.addResourceBundle(locale, 'Modes', dentalTranslations, true, true);
});

export const tracked = {
  measurements: '@ohif/extension-measurement-tracking.panelModule.trackedMeasurements',
  thumbnailList: '@ohif/extension-measurement-tracking.panelModule.seriesList',
  viewport: '@ohif/extension-measurement-tracking.viewportModule.cornerstone-tracked',
};

export const extensionDependencies = {
  ...basicDependencies,
  '@ohif/extension-measurement-tracking': '^3.0.0',
};

export const dentalInstance = {
  ...basicLayout,
  id: ohif.layout,
  props: {
    ...basicLayout.props,
    leftPanels: [tracked.thumbnailList],
    rightPanels: [cornerstone.segmentation, tracked.measurements],
    viewports: [
      {
        namespace: tracked.viewport,
        displaySetsToDisplay: basicLayout.props.viewports[0].displaySetsToDisplay,
      },
      ...basicLayout.props.viewports,
    ],
  },
};

export const dentalRoute = {
  ...basicRoute,
  path: 'dental',
  layoutInstance: dentalInstance,
};

export const modeInstance = {
  ...basicModeInstance,
  id,
  routeName: 'dental',
  displayName: i18n.t('Modes:Dental View'),
  routes: [dentalRoute],
  extensions: extensionDependencies,
};

const mode = {
  ...basicMode,
  id,
  modeInstance,
  extensionDependencies,
};

export default mode;
export { initToolGroups, toolbarButtons };
