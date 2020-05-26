import {
  PanelStudyBrowserTracking,
  PanelMeasurementTableTracking,
} from './Panels';

// TODO:
// - No loading UI exists yet
// - cancel promises when component is destroyed
// - show errors in UI for thumbnails if promise fails
function getPanelModule({
  commandsManager,
  extensionManager,
  servicesManager,
}) {
  return [
    {
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
      name: 'measure',
      iconName: 'list-bullets',
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
