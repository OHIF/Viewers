import { ServicesManager, CommandsManager, ExtensionManager } from '@ohif/core';
import LineChartViewport from './Components/LineChartViewport/index';

const getViewportModule = ({
  servicesManager,
  commandsManager,
  extensionManager,
}: {
  servicesManager: ServicesManager;
  commandsManager: CommandsManager;
  extensionManager: ExtensionManager;
}) => {
  return [
    {
      name: 'chartViewport',
      component: LineChartViewport,
    },
  ];
};

export { getViewportModule as default };
