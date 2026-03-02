import { CommandsManager, ExtensionManager } from '@ohif/core';
import LineChartViewport from './Components/LineChartViewport/index';
import XNATCornerstoneViewport from './Viewports/XNATCornerstoneViewport';

const getViewportModule = ({
  servicesManager,
  commandsManager,
  extensionManager,
}: {
  servicesManager: AppTypes.ServicesManager;
  commandsManager: CommandsManager;
  extensionManager: ExtensionManager;
}) => {
  return [
    {
      name: 'chartViewport',
      component: LineChartViewport,
    },
    {
      name: 'xnatCornerstone',
      component: XNATCornerstoneViewport,
    },
  ];
};

export { getViewportModule as default };
