import { ServicesManager, Types } from '@ohif/core';
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

export function addActivatePanelTriggers(
  servicesManager: ServicesManager
): Types.Subscription[] {
  const { panelService, measurementService } = servicesManager.services;

  // ActivatePanel event trigger for when measurements are added.
  // Do not force activation so as to respect the state the user may have left the UI in.
  return panelService.addActivatePanelTriggers(
    trackedMeasurementsPanelId,
    measurementService,
    [
      measurementService.EVENTS.MEASUREMENT_ADDED,
      measurementService.EVENTS.RAW_MEASUREMENT_ADDED,
    ]
  );
}

export default getPanelModule;
