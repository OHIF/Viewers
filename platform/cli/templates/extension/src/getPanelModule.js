import { PanelClock } from './Panels';

function getPanelModule({
  commandsManager,
  extensionManager,
  servicesManager,
}) {
  return [
    {
      name: 'clockPanel',
      iconName: 'calendar',
      iconLabel: 'Clock Panel',
      label: 'Clock Panel',
      component: PanelClock.bind(null, {
        commandsManager,
        extensionManager,
        servicesManager,
      }),
    },
  ];
}

export default getPanelModule;
