import i18n from 'i18next';
import { id } from './id';
import { initToolGroups, toolbarButtons, cornerstone,
  ohif,
  dicomsr,
  dicomvideo,
  basicLayout,
  basicRoute,
  extensionDependencies as basicDependencies,
  mode as basicMode,
  modeInstance as basicModeInstance,
 } from '@ohif/mode-basic';

export const tracked = {
  measurements: '@ohif/extension-measurement-tracking.panelModule.trackedMeasurements',
  thumbnailList: '@ohif/extension-measurement-tracking.panelModule.seriesList',
  viewport: '@ohif/extension-measurement-tracking.viewportModule.cornerstone-tracked',
};

export const extensionDependencies = {
  // Can derive the versions at least process.env.from npm_package_version
  ...basicDependencies,
  '@ohif/extension-measurement-tracking': '^3.0.0',
};

export const longitudinalInstance = {
  ...basicLayout,
  id: ohif.layout,
  props: {
    ...basicLayout.props,
    leftPanels: [tracked.thumbnailList],
    rightPanels: [cornerstone.segmentation, tracked.measurements],
    viewports: [
      {
        namespace: tracked.viewport,
        // Re-use the display sets from basic
        displaySetsToDisplay: basicLayout.props.viewports[0].displaySetsToDisplay,
      },
      ...basicLayout.props.viewports,
      ],
    }
  };


export const longitudinalRoute =
    {
      ...basicRoute,
      path: 'longitudinal',
        /*init: ({ servicesManager, extensionManager }) => {
          //defaultViewerRouteInit
        },*/
      layoutInstance: longitudinalInstance,
    };

export const modeInstance = {
    ...basicModeInstance,
    // TODO: We're using this as a route segment
    // We should not be.
    id,
    routeName: 'longitudinal',
    displayName: i18n.t('Modes:Basic Viewer'),
    routes: [
      longitudinalRoute
    ],
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
