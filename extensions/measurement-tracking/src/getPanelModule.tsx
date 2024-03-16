import { Types } from '@ohif/core';
import { PanelMeasurementTableTracking, PanelStudyBrowserTracking } from './panels';
import i18n from 'i18next';

// TODO:
// - No loading UI exists yet
// - cancel promises when component is destroyed
// - show errors in UI for thumbnails if promise fails
function getPanelModule({ commandsManager, extensionManager, servicesManager }): Types.Panel[] {
  return [
    {
      name: 'seriesList',
      iconName: 'tab-studies',
      iconLabel: 'Studies',
      label: i18n.t('SidePanel:Studies'),
      component: PanelStudyBrowserTracking.bind(null, {
        commandsManager,
        extensionManager,
        servicesManager,
      }),
    },

    {
      name: 'trackedMeasurements',
      iconName: 'tab-linear',
      iconLabel: 'Measure',
      label: i18n.t('SidePanel:Measurements'),
      component: PanelMeasurementTableTracking.bind(null, {
        commandsManager,
        extensionManager,
        servicesManager,
      }),
    },
  ];
}

export default getPanelModule;
