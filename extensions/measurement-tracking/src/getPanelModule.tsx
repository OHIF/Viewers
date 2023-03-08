import { Types } from '@ohif/core';
import {
  PanelMeasurementTableTracking,
  PanelStudyBrowserTracking,
} from './panels';

const trackedMeasurementsPanelId =
  '@ohif/extension-measurement-tracking.panelModule.trackedMeasurements';

// TODO:
// - No loading UI exists yet
// - cancel promises when component is destroyed
// - show errors in UI for thumbnails if promise fails
function getPanelModule({
  commandsManager,
  extensionManager,
  servicesManager,
}): Types.Panel[] {
  return [
    {
      id: '@ohif/extension-measurement-tracking.panelModule.seriesList',
      name: 'seriesList',
      iconName: 'group-layers',
      iconLabel: 'Studies',
      label: 'Studies',
      component: PanelStudyBrowserTracking.bind(null, {
        commandsManager,
        extensionManager,
        servicesManager,
      }),
    },

    {
      id: trackedMeasurementsPanelId,
      name: 'trackedMeasurements',
      iconName: 'tab-linear',
      iconLabel: 'Measure',
      label: 'Measurements',
      component: PanelMeasurementTableTracking.bind(null, {
        commandsManager,
        extensionManager,
        servicesManager,
      }),
    },
  ];
}

export default getPanelModule;
