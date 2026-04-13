import i18n from 'i18next';
import { ToolbarService } from '@ohif/core';
import { id } from './id';
import {
  initToolGroups,
  toolbarButtons as basicToolbarButtons,
  toolbarSections as basicToolbarSections,
  onModeExit as basicOnModeExit,
  cornerstone,
  ohif,
  basicLayout,
  basicRoute,
  extensionDependencies as basicDependencies,
  mode as basicMode,
  modeInstance as basicModeInstance,
} from '@ohif/mode-basic';
import dentalTranslations from './i18n/locales/en-US/Modes.json';

const { TOOLBAR_SECTIONS } = ToolbarService;

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
  '@ohif/extension-24x7-dental-ui': '^1.0.0',
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

const dentalThemeToggleButton = {
  id: 'DentalThemeToggle',
  uiType: 'dental.themeToggle',
  props: {},
} as const;

const dentalBrandTitleButton = {
  id: 'DentalBrandTitle',
  uiType: 'dental.brandTitle',
  props: {},
} as const;

export const toolbarButtons = [
  ...basicToolbarButtons,
  dentalThemeToggleButton,
  dentalBrandTitleButton,
];

export const toolbarSections = {
  ...basicToolbarSections,
  [TOOLBAR_SECTIONS.secondary]: ['DentalBrandTitle'],
  [TOOLBAR_SECTIONS.primary]: [
    ...basicToolbarSections[TOOLBAR_SECTIONS.primary],
    'DentalThemeToggle',
  ],
};

function onModeExit(this: typeof modeInstance, args: withAppTypes): void {
  basicOnModeExit.call(this, args);
  document.documentElement.classList.remove('dental-theme');
}

export const modeInstance = {
  ...basicModeInstance,
  id,
  routeName: 'dental',
  displayName: i18n.t('Modes:Dental View'),
  routes: [dentalRoute],
  extensions: extensionDependencies,
  toolbarButtons,
  toolbarSections,
  onModeExit,
};

const mode = {
  ...basicMode,
  id,
  modeInstance,
  extensionDependencies,
};

export default mode;
export { initToolGroups };
